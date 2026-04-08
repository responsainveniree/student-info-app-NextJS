import { OFFSET, TAKE_RECORDS } from "@/lib/constants/pagination";
import { SortOrder } from "@/lib/constants/sortingAndFilltering";
import { Prisma, PrismaClient } from "@prisma/client";

export const createUserWhere = <T extends Prisma.UserWhereInput>(where: T): T =>
  where;

export const createUserWhereUnique = <T extends Prisma.UserWhereUniqueInput>(
  where: T,
): T => where;

export const createUserSelect = <T extends Prisma.UserSelect>(select: T): T =>
  select;

export const createStudentWhere = <T extends Prisma.StudentWhereInput>(
  where: T,
): T => where;

export const createStudentWhereUnique = <
  T extends Prisma.StudentWhereUniqueInput,
>(
  where: T,
): T => where;

export const createStudentSelect = <T extends Prisma.StudentSelect>(
  select: T,
): T => select;

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

export const deleteUserById = async (
  id: string,
  tx: PrismaClient | Prisma.TransactionClient,
) => {
  return tx.user.delete({
    where: { id },
  });
};

export async function findUsersByIds<T extends Prisma.UserSelect>(
  userIds: string[],
  // Use Prisma.Subset to ensure T only contains valid User keys
  select: Prisma.Subset<T, Prisma.UserSelect>,
  tx: Prisma.TransactionClient | PrismaClient,
) {
  if (userIds.length === 0) return [];

  const result = await tx.user.findMany({
    where: { id: { in: userIds } },
    select: select,
  });

  return result as unknown as Prisma.UserGetPayload<{ select: T }>[];
}
export async function findUsersByName<T extends Prisma.UserFindManyArgs>(
  name: string,
  classId: number,
  select: T["select"],
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
    select,
    skip: page * OFFSET,
    take: TAKE_RECORDS,
    orderBy: {
      name: sortOrder === "asc" ? "asc" : "desc",
    },
  });
}

export async function findUsersByClassId<T extends Prisma.UserSelect>(
  classId: number,
  select: T,
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
    select,
    skip: page * OFFSET,
    take: TAKE_RECORDS,
    orderBy: {
      name: sortOrder === "asc" ? "asc" : "desc",
    },
  });
}

export const updateSingleUser = async (
  where: Prisma.UserWhereUniqueInput,
  data: Prisma.UserUpdateInput,
  tx: Prisma.TransactionClient | PrismaClient,
) => {
  return tx.user.update({
    where,
    data,
  });
};

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

export async function findTeachers<T extends Prisma.TeacherSelect>(
  where: Prisma.TeacherWhereInput,
  select: Prisma.Subset<T, Prisma.TeacherSelect>,
  tx: PrismaClient | Prisma.TransactionClient,
) {
  const result = tx.teacher.findMany({
    where: where,
    select: select,
  });

  return result as unknown as Prisma.TeacherGetPayload<{ select: T }>[];
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
      class: true,
      user: {
        select: { name: true, email: true },
      },
    },
  });
}

export const findStudents = async <T extends Prisma.StudentSelect>(
  where: Prisma.StudentWhereInput,
  select: Prisma.Subset<T, Prisma.StudentSelect>,
  isPaginationActive: boolean,
  page: number,
  tx: PrismaClient | Prisma.TransactionClient,
) => {
  const result = tx.student.findMany({
    where: where,
    select: select,
    skip: isPaginationActive ? page * OFFSET : undefined,
    take: isPaginationActive ? TAKE_RECORDS : undefined,
    orderBy: {
      user: {
        name: "asc",
      },
    },
  });

  return result as unknown as Prisma.StudentGetPayload<{ select: T }>[];
};

export async function findStudentProfilesByIds(
  userIds: string[],
  tx: PrismaClient,
) {
  return tx.student.findMany({
    where: { userId: { in: userIds } },
    select: { userId: true, classId: true },
  });
}

export const countStudent = async (
  where: Prisma.StudentWhereInput,
  tx: PrismaClient | Prisma.TransactionClient,
) => {
  return tx.student.count({
    where: where,
  });
};
