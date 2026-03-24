import { prisma } from "@/db/prisma";
import { assertAttendanceDateIsNotInFuture } from "@/domain/attendance/attendance-rules";
import { normalizeAttendanceType } from "@/domain/attendance/normalize-attendance-type";
import { assertDateIsInCurrentSemester } from "@/domain/date/date-rules";
import {
  HomeroomTeacherSession,
  SecretarySession,
} from "@/domain/types/sessions";
import { ValidAttendanceType } from "@/lib/constants/attendance";
import { MIN_SEARCH_LENGTH } from "@/lib/constants/pagination";
import { badRequest } from "@/lib/errors";
import { getDayBounds, parseDateString } from "@/lib/utils/date";
import {
  AttendanceSummaryQueriesSchema,
  BulkAttendanceSchema,
  StudentAttendacesQueriesSchema,
} from "@/lib/zod/attendance";
import {
  findAttendanceByIdsAndTodayDate,
  getAttendanceStatsByDate,
  getAttendanceStatsByStudentIds,
} from "@/repositories/attendance-repository";
import {
  findStudentProfilesByIds,
  findUsersByClassId,
  findUsersByName,
} from "@/repositories/user-repository";
import { Prisma } from "@prisma/client";

export async function createAttendance(
  data: BulkAttendanceSchema,
  secretarySession: SecretarySession | null,
  homeroomTeacherSession: HomeroomTeacherSession | null,
) {
  const { date, records } = data;

  if (records.length === 0) {
    return Response.json(
      { message: "No records to process." },
      { status: 200 },
    );
  }

  // VALIDATION: Date logic
  const attendanceDate = parseDateString(date);

  assertAttendanceDateIsNotInFuture(attendanceDate);

  assertDateIsInCurrentSemester(attendanceDate);

  // Pre-fetch available students & attendances data (Batching)
  const studentIds = records.map((r) => r.studentId);
  const { startOfDay, endOfDay } = getDayBounds(attendanceDate);

  const [existingStudents, existingAttendances] = await Promise.all([
    findStudentProfilesByIds(studentIds, prisma),
    findAttendanceByIdsAndTodayDate(studentIds, startOfDay, endOfDay, prisma),
  ]);

  const studentMap = new Map<
    string,
    { userId: string; classId: number | null }
  >(
    existingStudents.map((s: { userId: string; classId: number | null }) => [
      s.userId,
      s,
    ]),
  );
  const attendanceMap = new Map<
    string,
    {
      id: number;
      studentId: string;
      type: ValidAttendanceType;
      note: string;
      date: Date;
    }
  >(
    existingAttendances.map(
      (a: {
        id: number;
        studentId: string;
        type: any;
        note: string | null;
        date: Date;
      }) => [
        a.studentId,
        {
          id: a.id,
          studentId: a.studentId,
          type: a.type as ValidAttendanceType,
          note: a.note || "",
          date: a.date,
        },
      ],
    ),
  );

  const validationErrors: string[] = [];
  const normalizedRecords: Array<{
    studentId: string;
    type: ValidAttendanceType | null;
    description: string;
  }> = [];

  for (const record of records) {
    const student = studentMap.get(record.studentId);

    if (!student) {
      validationErrors.push(`Student ${record.studentId} not found.`);
      continue;
    }

    if (
      secretarySession &&
      student.classId !== secretarySession.classId &&
      homeroomTeacherSession &&
      student.classId !== homeroomTeacherSession.homeroom?.id
    ) {
      validationErrors.push(
        `Student ${record.studentId} is not in your class.`,
      );
      continue;
    }

    const normalizedType = normalizeAttendanceType(record.attendanceType);
    normalizedRecords.push({
      studentId: record.studentId,
      type: normalizedType,
      description:
        normalizedType === "ALPHA" || normalizedType === "LATE"
          ? ""
          : record.description || "",
    });
  }

  if (validationErrors.length > 0) {
    throw badRequest(`Validation failed: ${validationErrors.join("; ")}`);
  }

  const result = await prisma.$transaction(
    async (tx: Prisma.TransactionClient) => {
      let created = 0;
      let updated = 0;
      let deleted = 0;

      for (const record of normalizedRecords) {
        const existing = attendanceMap.get(record.studentId);

        if (record.type === null) {
          // Present = if there is a record, Delete attendance record
          if (existing) {
            await tx.attendance.delete({ where: { id: existing.id } });
            deleted++;
          }
        } else if (existing) {
          await tx.attendance.update({
            where: { id: existing.id },
            data: {
              type: record.type as ValidAttendanceType,
              note: record.description,
            },
          });
          updated++;
        } else {
          await tx.attendance.create({
            data: {
              studentId: record.studentId,
              type: record.type,
              note: record.description,
              date: attendanceDate,
            },
          });
          created++;
        }
      }

      return { created, updated, deleted };
    },
  );

  return result;
}

export async function getAttendance(
  data: StudentAttendacesQueriesSchema,
  secretarySession: SecretarySession | null,
  homeroomTeacherSession: HomeroomTeacherSession | null,
) {
  const targetDate = parseDateString(data.date);

  const { startOfDay, endOfDay } = getDayBounds(targetDate);

  let studentAttendanceRecords;

  const selectData = {
    id: true,
    name: true,
    studentProfile: {
      select: {
        attendance: {
          where: {
            date: {
              gte: startOfDay,
              lte: endOfDay,
            },
          },
          select: {
            date: true,
            type: true,
            note: true,
          },
        },
      },
    },
  };

  const classIdSession = secretarySession?.classId
    ? secretarySession.classId
    : homeroomTeacherSession?.homeroom?.id;

  if (data.searchQuery && data.searchQuery.length >= MIN_SEARCH_LENGTH) {
    studentAttendanceRecords = await findUsersByName(
      data.searchQuery,
      classIdSession,
      selectData,
      prisma,
      data.page,
      data.sortOrder,
    );
  } else {
    studentAttendanceRecords = await findUsersByClassId(
      classIdSession,
      selectData,
      prisma,
      data.page,
      data.sortOrder,
    );
  }

  const totalStudents = await prisma.user.count({
    where: {
      studentProfile: {
        classId: classIdSession,
      },
    },
  });

  // Get attendance stats for the selected date
  const attendanceStats = await getAttendanceStatsByDate(
    classIdSession,
    startOfDay,
    endOfDay,
    prisma,
  );

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

  return { totalStudents, attendanceStats: stats, studentAttendanceRecords };
}

export async function getAttendanceSumamry(
  data: AttendanceSummaryQueriesSchema,
  homeroomTeacherSession: HomeroomTeacherSession,
) {
  let students;

  const classIdSession = homeroomTeacherSession.homeroom?.id;

  const selectData = {
    name: true,
    id: true,
  };

  if (data.searchQuery && data.searchQuery?.length > MIN_SEARCH_LENGTH) {
    students = await findUsersByName(
      data.searchQuery,
      classIdSession,
      selectData,
      prisma,
      data.page,
      data.sortOrder,
    );
  } else {
    students = await findUsersByClassId(
      classIdSession,
      selectData,
      prisma,
      data.page,
      data.sortOrder,
    );
  }

  const studentIds = students.map((student: { id: string }) => student.id);

  const stats = await getAttendanceStatsByStudentIds(studentIds, prisma);

  const studentAttendanceSummaries = students.map(
    (student: { id: string; name: string }) => {
      const summary = stats
        .filter((s: { studentId: string }) => s.studentId === student.id)
        .map((s: { type: string; _count: number }) => ({
          type: s.type,
          count: s._count,
        }));

      return {
        id: student.id,
        name: student.name,
        attendanceSummary: summary,
      };
    },
  );

  const totalStudents = await prisma.student.count({
    where: {
      classId: classIdSession,
    },
  });

  return {
    studentAttendanceSummaries,
    totalStudents,
  };
}
