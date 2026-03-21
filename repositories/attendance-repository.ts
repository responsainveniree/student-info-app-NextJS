import { PrismaClient } from "@prisma/client";

export function findAttendanceByIdsAndTodayDate(
  userIds: string[],
  startOfDay: Date,
  endOfDay: Date,
  tx: PrismaClient,
) {
  return tx.attendance.findMany({
    where: {
      studentId: { in: userIds },
      date: { gte: startOfDay, lte: endOfDay },
    },
  });
}

export function getAttendanceStatsByDate(
  classId: number,
  startOfDay: Date,
  endOfDay: Date,
  tx: PrismaClient,
) {
  return tx.attendance.groupBy({
    by: ["type"],
    where: {
      date: {
        gte: startOfDay,
        lte: endOfDay,
      },
      student: {
        classId: classId,
      },
    },
    _count: {
      type: true,
    },
  });
}

export function getAttendanceStatsByStudentIds(
  studentIds: string[],
  tx: PrismaClient,
) {
  return tx.attendance.groupBy({
    by: ["type", "studentId"],
    where: {
      studentId: {
        in: studentIds,
      },
    },
    _count: true,
  });
}
