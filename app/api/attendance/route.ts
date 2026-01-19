import { badRequest, forbidden, handleError, notFound } from "@/lib/errors";
import { prisma } from "@/prisma/prisma";
import {
  VALID_ATTENDANCE_TYPES,
  ValidAttendanceType,
} from "@/lib/constants/attendance";
import {
  bulkAttendance,
  studentAttendacesQueries,
} from "@/lib/utils/zodSchema";
import {
  getDayBounds,
  getSemester,
  getSemesterDateRange,
} from "@/lib/utils/date";
import {
  MIN_SEARCH_LENGTH,
  OFFSET,
  TAKE_RECORDS,
} from "@/lib/constants/pagination";
import { ClassNumber, Grade, Major } from "@/lib/constants/class";

/**
 * Validates and normalizes the attendance type.
 * "present" means no record should exist - returns null.
 */
function normalizeAttendanceType(type: string): ValidAttendanceType | null {
  const normalized = type.toUpperCase().trim();

  if (normalized === "PRESENT") {
    return null;
  }

  if (!VALID_ATTENDANCE_TYPES.includes(normalized as ValidAttendanceType)) {
    throw badRequest(
      `Invalid attendance type: "${type}". Valid types are: ${VALID_ATTENDANCE_TYPES.join(", ")}, or "PRESENT".`,
    );
  }

  return normalized as ValidAttendanceType;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { recorderId, date, records } = bulkAttendance.parse(body);

    // ============================================
    // VALIDATION 1: Required fields
    // ============================================
    if (!recorderId || !date || !Array.isArray(records)) {
      throw badRequest(
        "Missing required fields: secretaryId, date, and records array.",
      );
    }

    if (records.length === 0) {
      return Response.json(
        { message: "No records to process." },
        { status: 200 },
      );
    }

    // ============================================
    // VALIDATION 2: Parse and validate date
    // ============================================
    const attendanceDate = new Date(date);
    attendanceDate.setHours(0, 0, 0, 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (attendanceDate > today) {
      throw badRequest("Attendance date cannot be in the future.");
    }

    const { start: semesterStart, end: semesterEnd } =
      getSemesterDateRange(today);

    if (attendanceDate < semesterStart || attendanceDate > semesterEnd) {
      const semesterNum = getSemester(today);
      throw badRequest(
        `Attendance date is outside the current semester (Semester ${semesterNum}). ` +
          `Allowed range: ${semesterStart.toISOString().split("T")[0]} to ${semesterEnd.toISOString().split("T")[0]}.`,
      );
    }

    // ============================================
    // VALIDATION 3: Secretary role check
    // ============================================

    let accessContext: {
      homeroomTeacherId: string;
    } | null = null;

    const secretary = await prisma.student.findUnique({
      where: { id: recorderId },
      select: { role: true, homeroomTeacherId: true },
    });

    if (secretary) {
      if (!secretary) {
        throw notFound("Secretary not found.");
      }

      if (secretary.role !== "CLASS_SECRETARY") {
        throw forbidden("Only class secretaries can record attendance.");
      }

      accessContext = {
        homeroomTeacherId: secretary.homeroomTeacherId,
      };
    }

    const homeroomTeacher = await prisma.teacher.findUnique({
      where: {
        id: recorderId,
      },
      select: {
        role: true,
        id: true,
      },
    });

    if (!accessContext && homeroomTeacher) {
      if (homeroomTeacher.role !== "TEACHER" || !homeroomTeacher) {
        throw forbidden("Access denied");
      }

      accessContext = {
        homeroomTeacherId: homeroomTeacher.id,
      };
    }

    if (!accessContext) {
      throw forbidden("Access denied");
    }

    // ============================================
    // VALIDATION 4: Pre-validate all records before transaction
    // ============================================
    const studentIds = records.map((r) => r.studentId);
    const uniqueStudentIds = [...new Set(studentIds)];

    const existingStudents = await prisma.student.findMany({
      where: { id: { in: uniqueStudentIds } },
      select: { id: true, homeroomTeacherId: true },
    });

    const existingStudentMap = new Map(existingStudents.map((s) => [s.id, s]));

    // Validate all students exist and belong to same class
    const validationErrors: string[] = [];
    const normalizedRecords: Array<{
      studentId: string;
      type: ValidAttendanceType | null;
      description: string;
    }> = [];

    for (const record of records) {
      const student = existingStudentMap.get(record.studentId);

      if (!student) {
        validationErrors.push(`Student ${record.studentId} not found.`);
        continue;
      }

      if (student.homeroomTeacherId !== accessContext.homeroomTeacherId) {
        validationErrors.push(
          `Student ${record.studentId} is not in your class.`,
        );
        continue;
      }

      try {
        const normalizedType = normalizeAttendanceType(record.attendanceType);
        const description =
          normalizedType === "ALPHA" || normalizedType === "LATE"
            ? ""
            : record.description || "";

        normalizedRecords.push({
          studentId: record.studentId,
          type: normalizedType,
          description,
        });
      } catch (error: any) {
        validationErrors.push(
          `Invalid attendance type for student ${record.studentId}: ${record.attendanceType}`,
        );
      }
    }

    // If any validation errors, reject the entire batch
    if (validationErrors.length > 0) {
      throw badRequest(
        `Validation failed for ${validationErrors.length} record(s): ${validationErrors.join("; ")}`,
      );
    }

    // ============================================
    // TRANSACTIONAL BULK OPERATION
    // ============================================
    const { startOfDay, endOfDay } = getDayBounds(attendanceDate);

    const result = await prisma.$transaction(async (tx) => {
      let created = 0;
      let updated = 0;
      let deleted = 0;

      for (const record of normalizedRecords) {
        // Find existing attendance for this student on this date
        const existing = await tx.studentAttendance.findFirst({
          where: {
            studentId: record.studentId,
            date: {
              gte: startOfDay,
              lte: endOfDay,
            },
          },
        });

        if (record.type === null) {
          // "present" - delete existing record if any
          if (existing) {
            await tx.studentAttendance.delete({
              where: { id: existing.id },
            });
            deleted++;
          }
        } else if (existing) {
          // Update existing record
          await tx.studentAttendance.update({
            where: { id: existing.id },
            data: {
              type: record.type,
              description: record.description,
            },
          });
          updated++;
        } else {
          // Create new record
          await tx.studentAttendance.create({
            data: {
              studentId: record.studentId,
              type: record.type,
              description: record.description,
              date: attendanceDate,
            },
          });
          created++;
        }
      }

      return { created, updated, deleted };
    });

    return Response.json(
      {
        message: `Bulk attendance saved successfully. Created: ${result.created}, Updated: ${result.updated}, Deleted (marked present): ${result.deleted}`,
        data: result,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("API_ERROR", {
      route: "/api/student/attendance",
      message: error instanceof Error ? error.message : String(error),
    });
    return handleError(error);
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const rawParams = Object.fromEntries(searchParams.entries());

    const data = studentAttendacesQueries.parse(rawParams);

    let accessContext: {
      classNumber: ClassNumber;
      grade: Grade;
      major: Major;
    } | null = null;

    const secretary = await prisma.student.findUnique({
      where: { id: data.id },
      select: {
        role: true,
        homeroomTeacherId: true,
        classNumber: true,
        major: true,
        grade: true,
      },
    });

    if (secretary) {
      if (secretary.role !== "CLASS_SECRETARY") {
        throw forbidden("Access denied");
      }

      if (secretary.homeroomTeacherId !== data.homeroomTeacherId) {
        throw forbidden("You can only access your own class");
      }

      accessContext = {
        classNumber: secretary.classNumber as ClassNumber,
        grade: secretary.grade,
        major: secretary.major,
      };
    }

    const homeroomTeacher = await prisma.teacher.findUnique({
      where: {
        id: data.id,
      },
      select: {
        role: true,
        homeroomClass: true,
      },
    });

    if (!accessContext && homeroomTeacher) {
      if (
        homeroomTeacher.role !== "TEACHER" ||
        !homeroomTeacher.homeroomClass
      ) {
        throw forbidden("Access denied");
      }

      accessContext = {
        classNumber: homeroomTeacher.homeroomClass.classNumber as ClassNumber,
        grade: homeroomTeacher.homeroomClass.grade,
        major: homeroomTeacher.homeroomClass.major,
      };
    }

    if (!accessContext) {
      throw forbidden("Access denied");
    }

    const targetDate = new Date(data.date);
    const { startOfDay, endOfDay } = getDayBounds(targetDate);

    let studentAttendanceRecords;

    if (data.searchQuery && data.searchQuery.length >= MIN_SEARCH_LENGTH) {
      studentAttendanceRecords = await prisma.student.findMany({
        where: {
          name: {
            contains: data.searchQuery,
            mode: "insensitive",
          },
        },
        select: {
          id: true,
          name: true,
          attendances: {
            where: {
              date: {
                gte: startOfDay,
                lte: endOfDay,
              },
            },
            select: {
              date: true,
              type: true,
              description: true,
            },
          },
        },
        skip: data.page * OFFSET,
        take: TAKE_RECORDS,
        orderBy: {
          name: data.sortOrder === "asc" ? "asc" : "desc",
        },
      });
    } else if (data.sortBy === "name") {
      studentAttendanceRecords = await prisma.student.findMany({
        where: {
          classNumber: accessContext.classNumber,
          grade: accessContext.grade,
          major: accessContext.major,
        },
        select: {
          id: true,
          name: true,
          attendances: {
            where: {
              date: {
                gte: startOfDay,
                lte: endOfDay,
              },
            },
            select: {
              date: true,
              type: true,
              description: true,
            },
          },
        },
        skip: data.page * OFFSET,
        take: TAKE_RECORDS,
        orderBy: {
          name: data.sortOrder === "asc" ? "asc" : "desc",
        },
      });
    } else {
      studentAttendanceRecords = await prisma.student.findMany({
        where: {
          classNumber: accessContext.classNumber,
          grade: accessContext.grade,
          major: accessContext.major,
        },
        select: {
          id: true,
          name: true,
          attendances: {
            where: {
              date: {
                gte: startOfDay,
                lte: endOfDay,
              },
            },
            select: {
              date: true,
              type: true,
              description: true,
            },
            orderBy: {
              type: data.sortOrder === "asc" ? "asc" : "desc",
            },
          },
        },
        skip: data.page * OFFSET,
        take: TAKE_RECORDS,
      });
    }

    const totalStudents = await prisma.student.count({
      where: {
        classNumber: accessContext.classNumber,
        grade: accessContext.grade,
        major: accessContext.major,
      },
    });

    // Get attendance stats for the selected date (for Option B: stats from API)
    const attendanceStats = await prisma.studentAttendance.groupBy({
      by: ["type"],
      where: {
        date: {
          gte: startOfDay,
          lte: endOfDay,
        },
        student: {
          classNumber: accessContext.classNumber,
          grade: accessContext.grade,
          major: accessContext.major,
        },
      },
      _count: {
        type: true,
      },
    });

    // Transform stats into a more usable format
    const stats = {
      sick: 0,
      permission: 0,
      alpha: 0,
      late: 0,
    };

    for (const stat of attendanceStats) {
      if (stat.type === "SICK") stats.sick = stat._count.type;
      else if (stat.type === "PERMISSION") stats.permission = stat._count.type;
      else if (stat.type === "ALPHA") stats.alpha = stat._count.type;
      else if (stat.type === "LATE") stats.late = stat._count.type;
    }

    return Response.json(
      {
        message: "Attendance retrieved successfully.",
        data: { studentAttendanceRecords, totalStudents, stats },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("API_ERROR", {
      route: "/api/student/attendance",
      message: error instanceof Error ? error.message : String(error),
    });
    return handleError(error);
  }
}
