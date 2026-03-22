import { OFFSET, TAKE_RECORDS } from "@/lib/constants/pagination";
import { Prisma, PrismaClient } from "@prisma/client";

export async function findDemeritPointsByRecorder<
  T extends Prisma.DemeritPointSelect,
>(
  userId: string,
  selectData: Prisma.Subset<T, Prisma.DemeritPointSelect>,
  page: number,
  tx: PrismaClient | Prisma.TransactionClient,
) {
  if (!userId) return [];

  const result = tx.demeritPoint.findMany({
    where: {
      recordedById: userId,
    },
    select: selectData,
    take: TAKE_RECORDS,
    skip: page * OFFSET,
  });

  return result as unknown as Prisma.DemeritPointGetPayload<{ select: T }>;
}

export async function countDemeritPointsByRecorder(
  userId: string,
  tx: PrismaClient | Prisma.TransactionClient,
) {
  return tx.demeritPoint.count({
    where: {
      recordedById: userId,
    },
  });
}

export async function findUniqueDemeritPoint<
  T extends Prisma.DemeritPointSelect,
>(
  demeritPointId: number,
  selectData: Prisma.Subset<T, Prisma.DemeritPointSelect>,
  tx: PrismaClient | Prisma.TransactionClient,
) {
  const result = await tx.demeritPoint.findUnique({
    where: {
      id: demeritPointId,
    },
    select: selectData,
  });

  return result as unknown as Prisma.DemeritPointGetPayload<{ select: T }>;
}

export async function findDemeritPointsByDateAndStudentId<
  T extends Prisma.DemeritPointSelect,
>(
  date: string,
  studentId: string,
  selectData: Prisma.Subset<T, Prisma.DemeritPointSelect>,
  tx: PrismaClient | Prisma.TransactionClient,
) {
  const result = await tx.demeritPoint.findMany({
    where: {
      date: date,
      studentId: studentId,
    },
    select: selectData,
  });

  return result as unknown as Prisma.DemeritPointGetPayload<{ select: T }>[];
}
