import { prisma } from "@/db/prisma";
import { assertDateIsInCurrentSemester } from "@/domain/date/date-rules";
import {
  isSinglePerDayCategory,
  validateDailyDemeritLimit,
} from "@/domain/demerit-point/demerit-point-rules";
import {
  demeritCheckSelect,
  selectDemeritPointWithStudent,
} from "@/domain/types/demerit-types";
import { TeacherSession } from "@/domain/types/sessions";
import {
  categoryLabelMap,
  ValidInfractionType,
} from "@/lib/constants/discplinary";
import { badRequest, notFound } from "@/lib/errors";
import {
  CreateDemeritPointSchema,
  UpdateDemeritPointSchema,
} from "@/lib/zod/demerit-point";
import {
  countDemeritPointsByRecorder,
  findDemeritPointsByDateAndStudentId,
  findDemeritPointsByRecorder,
  findUniqueDemeritPoint,
} from "@/repositories/demerit-repository";
import { findUsersByIds } from "@/repositories/user-repository";
import { Prisma } from "@prisma/client";

export async function createDemeritPoint(
  data: CreateDemeritPointSchema,
  teacherSession: TeacherSession,
) {
  const demeritPointDate = new Date(data.date);

  assertDateIsInCurrentSemester(demeritPointDate);

  // Just in case, If we can validate through frontend, we dont have to revalidate it again in backend
  const uniqueStudentIds = [...new Set(data.studentsId)] as string[];

  const students = await findUsersByIds(
    uniqueStudentIds,
    demeritCheckSelect,
    prisma,
  );

  const demeritPointsToCreate: Prisma.DemeritPointCreateManyInput[] = [];

  if (students.length === 0) {
    throw notFound("No student data found");
  }

  for (const student of students) {
    if (isSinglePerDayCategory(data.demeritCategory)) {
      validateDailyDemeritLimit(student);
    }

    demeritPointsToCreate.push({
      studentId: student.id,
      category: data.demeritCategory as ValidInfractionType,
      points: data.points,
      date: new Date(data.date).toISOString(),
      description: data.description,
      recordedById: teacherSession.userId,
    });
  }

  await prisma.demeritPoint.createMany({
    data: demeritPointsToCreate,
  });
}

export async function getDemeritPoint(
  teacherSession: TeacherSession,
  page: number,
) {
  const selectAssignedDemeritPoints =
    Prisma.validator<Prisma.DemeritPointSelect>()({
      id: true,
      points: true,
      category: true,
      date: true,
      description: true,
      student: {
        select: {
          user: {
            select: {
              name: true,
              id: true,
            },
          },
        },
      },
    });

  const [assignedDemeritPoints, totalRecords] = await Promise.all([
    await findDemeritPointsByRecorder(
      teacherSession.userId,
      selectAssignedDemeritPoints,
      page,
      prisma,
    ),
    await countDemeritPointsByRecorder(teacherSession.userId, prisma),
  ]);

  return {
    assignedDemeritPoints,
    totalRecords,
  };
}

export async function deleteDemeritPoint(demeritPointId: number) {
  if (!demeritPointId) {
    throw badRequest("Demerit point ID is missing");
  }

  await prisma.demeritPoint.delete({
    where: {
      id: demeritPointId,
    },
  });
}

export async function updateDemeritPoint(data: UpdateDemeritPointSchema) {
  const existingDemeritPoint = await findUniqueDemeritPoint(
    data.demeritRecordId,
    selectDemeritPointWithStudent,
    prisma,
  );

  if (!existingDemeritPoint) {
    throw notFound("Demerit point record was not found");
  }

  const selectDemeritPointsCategory =
    Prisma.validator<Prisma.DemeritPointSelect>()({
      category: true,
      id: true,
    });

  const demeritPointRecords = await findDemeritPointsByDateAndStudentId(
    new Date(data.date).toISOString(),
    existingDemeritPoint.student.user.id,
    selectDemeritPointsCategory,
    prisma,
  );

  const conflictingRecord = demeritPointRecords.find(
    (record) => record.category === data.demeritCategory,
  );

  // The reason why I don't move this part into another file or using "validateDailyDemeritLimit", because in this part has a different data structure and I need to add two extra parameter with the type safety only for simple validation.
  if (isSinglePerDayCategory(data.demeritCategory) && conflictingRecord) {
    if (conflictingRecord.id !== data.demeritRecordId) {
      throw badRequest(
        `This ${existingDemeritPoint.student.user.name} already has a "${categoryLabelMap[data.demeritCategory]}" record today. Only one per day is allowed.`,
      );
    }
  }

  const demeritRecordDate = new Date(data.date);

  assertDateIsInCurrentSemester(demeritRecordDate);

  await prisma.demeritPoint.update({
    where: {
      id: data.demeritRecordId,
    },
    data: {
      category: data.demeritCategory,
      points: data.points,
      date: new Date(data.date),
      description: data.description,
    },
  });
}
