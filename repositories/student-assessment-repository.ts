import { Prisma, PrismaClient } from "@prisma/client";

export const createAssessmentWhere = <T extends Prisma.AssessmentWhereInput>(
  where: T,
): T => where;

export const createAssessmentWhereUnique = <
  T extends Prisma.AssessmentWhereUniqueInput,
>(
  where: T,
): T => where;

export const createAssessmentSelect = <T extends Prisma.AssessmentSelect>(
  select: T,
): T => select;

export const findAssessments = async <T extends Prisma.AssessmentSelect>(
  whereQuery: Prisma.AssessmentWhereInput,
  selectData: Prisma.AssessmentSelect,
  tx: PrismaClient | Prisma.TransactionClient,
) => {
  const result = tx.assessment.findMany({
    where: whereQuery,
    select: selectData,
  });

  return result as unknown as Prisma.AssessmentGetPayload<{ select: T }>;
};

export const findUniqueAssessment = async <T extends Prisma.AssessmentSelect>(
  whereQuery: Prisma.AssessmentWhereUniqueInput,
  selectData: Prisma.AssessmentSelect,
  tx: PrismaClient | Prisma.TransactionClient,
) => {
  const result = tx.assessment.findUnique({
    where: whereQuery,
    select: selectData,
  });

  return result as unknown as Prisma.AssessmentGetPayload<{ select: T }>;
};
