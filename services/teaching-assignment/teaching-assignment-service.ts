import { prisma } from "@/db/prisma";
import { findTeachingAssignments } from "@/repositories/teaching-assignment-repository";
import { Prisma } from "@prisma/client";

export const getTeachingAssignment = async (teacherId: string) => {
  const selectData = Prisma.validator<Prisma.TeachingAssignmentSelect>()({
    classId: true,
    class: {
      select: {
        grade: true,
        major: true,
        section: true,
      },
    },
    subject: {
      select: {
        id: true,
        name: true,
      },
    },
  });

  const teachingAssignments = await findTeachingAssignments(
    teacherId,
    selectData,
    prisma,
  );

  return {
    teachingAssignments,
  };
};
