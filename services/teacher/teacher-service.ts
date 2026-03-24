import { prisma } from "@/db/prisma";
import { TeacherFetchType } from "@/lib/constants/teacher";
import { findTeachingAssignments } from "@/repositories/teaching-assignment-repository";
import { findTeachers } from "@/repositories/user-repository";
import { Prisma } from "@prisma/client";

export const getTeacher = async (teacherFetchType: TeacherFetchType) => {
  const teacherWhereCondition: Prisma.TeacherWhereInput = {
    staffRole: "TEACHER",
  };

  const teacherSelect = Prisma.validator<Prisma.TeacherSelect>()({
    homeroom: {
      select: { id: true },
    },
    user: {
      select: {
        name: true,
        id: true,
      },
    },
  });

  if ((teacherFetchType as TeacherFetchType) === "nonHomeroom") {
    teacherWhereCondition.homeroom = null;
  }

  const teachers = await findTeachers(
    teacherWhereCondition,
    teacherSelect,
    prisma,
  );

  return {
    teachers,
  };
};
