import { OFFSET, TAKE_RECORDS } from "@/lib/constants/pagination";
import { SortOrder } from "@/lib/constants/sortingAndFilltering";
import { Prisma, PrismaClient } from "@prisma/client";

// User
export async function findUserByEmail(
  email: string,
  tx: PrismaClient | Prisma.TransactionClient,
) {
  return tx.user.findUnique({
    where: { email },
    select: {
      id: true,
      name: true,
      email: true,
    },
  });
}

export async function findUsersByName(
  name: string,
  classId: number,
  selectData: Prisma.UserSelect,
  tx: PrismaClient,
  page: number,
  sortOrder: SortOrder,
) {
  return tx.user.findMany({
    where: {
      name: {
        contains: name,
        mode: "insensitive",
      },
      studentProfile: {
        classId: classId,
      },
      role: "STUDENT",
    },
    select: selectData,
    skip: page * OFFSET,
    take: TAKE_RECORDS,
    orderBy: {
      name: sortOrder === "asc" ? "asc" : "desc",
    },
  });
}

export async function findUsersByClassId(
  classId: number,
  selectData: Prisma.UserSelect,
  tx: PrismaClient,
  page: number,
  sortOrder: SortOrder,
) {
  return tx.user.findMany({
    where: {
      studentProfile: {
        classId: classId,
      },
    },
    select: selectData,
    skip: page * OFFSET,
    take: TAKE_RECORDS,
    orderBy: {
      name: sortOrder === "asc" ? "asc" : "desc",
    },
  });
}

// Teacher
export async function findTeacher(userIdParam: string, tx: PrismaClient) {
  return tx.teacher.findUnique({
    where: { userId: userIdParam },
    select: {
      userId: true,
      staffRole: true,
      homeroom: true,
      user: {
        select: { name: true },
      },
    },
  });
}

// Student
export async function findStudentById(userIdParam: string, tx: PrismaClient) {
  return tx.student.findUnique({
    where: {
      userId: userIdParam,
    },
    select: {
      userId: true,
      studentRole: true,
      classId: true,
      user: {
        select: { name: true },
      },
    },
  });
}

export async function findStudentProfilesByIds(
  userIds: string[],
  tx: PrismaClient,
) {
  return tx.student.findMany({
    where: { userId: { in: userIds } },
    select: { userId: true, classId: true },
  });
}
