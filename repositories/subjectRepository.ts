import { prisma } from "@/db/prisma";
import { Grade, Major } from "@/lib/constants/class";

export async function findSubjects() {
  return prisma.subject.findMany({
    select: {
      id: true,
      name: true,
      config: true,
    },
  });
}

export async function findSubjectsForClass(grade: Grade, major: Major) {
  return prisma.subject.findMany({
    where: {
      config: {
        allowedGrades: {
          has: grade,
        },
        allowedMajors: {
          has: major,
        },
      },
    },
    select: {
      id: true,
      name: true,
    },
  });
}
