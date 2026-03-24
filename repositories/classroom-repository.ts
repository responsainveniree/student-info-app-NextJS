import { Prisma, PrismaClient } from "@prisma/client";

export const createClassroomWhere = <T extends Prisma.ClassroomWhereInput>(
  where: T,
): T => where;

export const createClassroomWhereUnique = <
  T extends Prisma.ClassroomWhereUniqueInput,
>(
  where: T,
): T => where;

export const createClassroomSelect = <T extends Prisma.ClassroomSelect>(
  select: T,
): T => select;

export const findClassrooms = async <T extends Prisma.ClassroomSelect>(
  whereQuery: Prisma.ClassroomWhereInput | {},
  selectData: Prisma.Subset<T, Prisma.ClassroomSelect> | undefined,
  tx: PrismaClient | Prisma.TransactionClient,
) => {
  return tx.classroom.findMany({
    where: whereQuery,
    select: selectData,
  });
};

export const findUniqueClassroom = async <T extends Prisma.ClassroomSelect>(
  whereQuery: Prisma.ClassroomWhereUniqueInput,
  selectData: Prisma.Subset<T, Prisma.ClassroomSelect> | undefined,
  tx: PrismaClient | Prisma.TransactionClient,
) => {
  const result = tx.classroom.findUnique({
    where: whereQuery,
    select: selectData,
  });

  return result as unknown as Prisma.ClassroomGetPayload<{ select: T }>;
};
