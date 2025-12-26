import { badRequest, forbidden, handleError, notFound } from "@/lib/errors";
import { prisma } from "@/prisma/prisma";

// Valid attendance types that can be stored in the database
const VALID_ATTENDANCE_TYPES = ["alpha", "sick", "permission"] as const;
type ValidAttendanceType = (typeof VALID_ATTENDANCE_TYPES)[number];

interface BulkAttendanceRecord {
  studentId: string;
  attendanceType: string;
  description?: string;
}

interface BulkAttendancePayload {
  secretaryId: string;
  date: string;
  records: BulkAttendanceRecord[];
}

/**
 * Validates and normalizes the attendance type.
 * "present" means no record should exist - returns null.
 */
function normalizeAttendanceType(type: string): ValidAttendanceType | null {
  const normalized = type.toLowerCase().trim();

  if (normalized === "present") {
    return null;
  }

  if (!VALID_ATTENDANCE_TYPES.includes(normalized as ValidAttendanceType)) {
    throw badRequest(
      `Invalid attendance type: "${type}". Valid types are: ${VALID_ATTENDANCE_TYPES.join(", ")}, or "present".`
    );
  }

  return normalized as ValidAttendanceType;
}

/**
 * Determines the semester based on the date.
 */
function getSemester(date: Date): 1 | 2 {
  const month = date.getMonth() + 1;
  return month >= 7 && month <= 12 ? 1 : 2;
}

/**
 * Gets the valid date range for the current semester.
 */
function getSemesterDateRange(referenceDate: Date): { start: Date; end: Date } {
  const year = referenceDate.getFullYear();
  const semester = getSemester(referenceDate);

  if (semester === 2) {
    return {
      start: new Date(year, 0, 1),
      end: new Date(year, 5, 30, 23, 59, 59, 999),
    };
  }

  return {
    start: new Date(year, 6, 1),
    end: new Date(year, 11, 31, 23, 59, 59, 999),
  };
}

/**
 * Gets the start and end of a specific day for date range queries.
 */
function getDayBounds(date: Date): { startOfDay: Date; endOfDay: Date } {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  return { startOfDay, endOfDay };
}

export async function POST(req: Request) {
  try {
    const body: BulkAttendancePayload = await req.json();
    const { secretaryId, date, records } = body;

    // ============================================
    // VALIDATION 1: Required fields
    // ============================================
    if (!secretaryId || !date || !Array.isArray(records)) {
      throw badRequest(
        "Missing required fields: secretaryId, date, and records array."
      );
    }

    if (records.length === 0) {
      return Response.json(
        { message: "No records to process." },
        { status: 200 }
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
          `Allowed range: ${semesterStart.toISOString().split("T")[0]} to ${semesterEnd.toISOString().split("T")[0]}.`
      );
    }

    // ============================================
    // VALIDATION 3: Secretary role check
    // ============================================
    const secretary = await prisma.student.findUnique({
      where: { id: secretaryId },
      select: { role: true, homeroomTeacherId: true },
    });

    if (!secretary) {
      throw notFound("Secretary not found.");
    }

    if (secretary.role !== "classSecretary") {
      throw forbidden("Only class secretaries can record attendance.");
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

      if (student.homeroomTeacherId !== secretary.homeroomTeacherId) {
        validationErrors.push(
          `Student ${record.studentId} is not in your class.`
        );
        continue;
      }

      try {
        const normalizedType = normalizeAttendanceType(record.attendanceType);
        const description =
          normalizedType === "alpha" ? "" : record.description || "";

        normalizedRecords.push({
          studentId: record.studentId,
          type: normalizedType,
          description,
        });
      } catch (error: any) {
        validationErrors.push(
          `Invalid attendance type for student ${record.studentId}: ${record.attendanceType}`
        );
      }
    }

    // If any validation errors, reject the entire batch
    if (validationErrors.length > 0) {
      throw badRequest(
        `Validation failed for ${validationErrors.length} record(s): ${validationErrors.join("; ")}`
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
      { status: 200 }
    );
  } catch (error) {
    console.error("Bulk attendance error:", error);
    return handleError(error);
  }
}
