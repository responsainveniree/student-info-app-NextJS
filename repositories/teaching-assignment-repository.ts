import { Prisma, PrismaClient } from "@prisma/client";

export const createTeachingAssignmentWhere = <
  T extends Prisma.TeachingAssignmentWhereInput,
>(
  where: T,
): T => where;

export const createTeachingAssignmentWhereUnique = <
  T extends Prisma.TeachingAssignmentWhereUniqueInput,
>(
  where: T,
): T => where;

export const createTeachingAssignmentSelect = <
  T extends Prisma.TeachingAssignmentSelect,
>(
  select: T,
): T => select;

export const findTeachingAssignments = async <
  T extends Prisma.TeachingAssignmentSelect,
>(
  userId: string,
  selectData: Prisma.Subset<T, Prisma.TeachingAssignmentSelect>,
  tx: PrismaClient | Prisma.TransactionClient,
) => {
  const result = tx.teachingAssignment.findMany({
    where: {
      teacherId: userId,
    },
    select: selectData,
  });

  return result as unknown as Prisma.TeachingAssignmentGetPayload<{
    select: T;
  }>;
};

export const findUniqueTeachingAssignment = async <
  T extends Prisma.TeachingAssignmentSelect,
>(
  whereQuery: Prisma.TeachingAssignmentWhereUniqueInput,
  selectData: Prisma.Subset<T, Prisma.TeachingAssignmentSelect>,
  tx: PrismaClient | Prisma.TransactionClient,
) => {
  const result = tx.teachingAssignment.findUnique({
    where: whereQuery,
    select: selectData,
  });

  return result as unknown as Prisma.TeachingAssignmentGetPayload<{
    select: T;
  }>;
};
