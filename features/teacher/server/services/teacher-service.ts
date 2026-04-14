import { prisma } from "@/db/prisma";
import {
  checkIsClassroomDirty,
  ensureClassroomExists,
  ensureHomeroomTeacherIsEmpty,
} from "@/domain/classroom/classroom-rules";
import { ensureTeacherExists } from "@/domain/teacher/teacher-rules";
import { checkIsTeacherDataDirty } from "@/domain/teacher/teacher-validations";
import {
  createTeacherSelect,
  createTeacherWhereUnique,
  findTeacher,
  findTeachers,
  teacherUpdateOperation,
} from "@/features/teacher/server/repository/teacher-repositories";
import { ClassSection, Grade } from "@/lib/constants/class";
import { TeacherFetchType } from "@/lib/constants/teacher";
import { badRequest, notFound } from "@/lib/errors";
import hashing from "@/lib/utils/hashing";
import {
  findMissingTeachingAssignment,
  validateTeachingStructure,
} from "@/lib/validation/teachingValidators";
import { TeacherUpdateSchema } from "@/lib/zod/teacher";
import {
  createClassroomSelect,
  findClassrooms,
} from "@/repositories/classroom-repository";
import { Major, Prisma } from "@prisma/client";

export const getTeachers = async (teacherFetchType: TeacherFetchType) => {
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
        email: true,
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

  return teachers;
};

export const deleteTeacher = async (id: string) => {
  if (!id) {
    throw badRequest("User id is missing");
  }

  await prisma.user.delete({ where: { id } });
};

export const updateTeacher = async (
  clientUserId: string,
  data: TeacherUpdateSchema,
) => {
  if (data.teachingAssignments && data.teachingAssignments?.length > 0)
    validateTeachingStructure(data.teachingAssignments);

  const teacherWhereUnique = createTeacherWhereUnique({ userId: clientUserId });

  const teacherSelect = createTeacherSelect({
    userId: true,
    user: {
      select: {
        name: true,
        email: true,
        password: true,
      },
    },
    homeroom: true,
    assignments: {
      select: {
        id: true,
        subjectId: true,
        class: true,
      },
    },
  });

  const teacherServerData = await findTeacher(
    teacherWhereUnique,
    teacherSelect,
    prisma,
  );

  ensureTeacherExists(teacherServerData);

  let newPassword: string | undefined = undefined;

  if (data.passwordSchema?.password && data.passwordSchema.confirmPassword) {
    newPassword = await hashing(data.passwordSchema.confirmPassword);
  }

  const classroomSelectCondition = createClassroomSelect({
    homeroomTeacherId: true,
    grade: true,
    major: true,
    section: true,
  });

  const classrooms = await findClassrooms({}, classroomSelectCondition, prisma);

  let isClassroomDirty: boolean = false;

  const isClassDataFilled =
    data.homeroomClass?.grade &&
    data.homeroomClass.major &&
    data.homeroomClass.section;

  if (teacherServerData.homeroom?.homeroomTeacherId && isClassDataFilled) {
    const findHomeroomClass = classrooms.find(
      (classroom) =>
        classroom.grade === data.homeroomClass?.grade &&
        classroom.major === data.homeroomClass.major &&
        classroom.section === data.homeroomClass.section,
    );

    ensureClassroomExists(findHomeroomClass);

    ensureHomeroomTeacherIsEmpty(findHomeroomClass!, clientUserId);

    if (teacherServerData?.homeroom?.homeroomTeacherId) {
      isClassroomDirty = checkIsClassroomDirty(
        teacherServerData?.homeroom,
        data.homeroomClass!,
      );
    } else {
      isClassroomDirty = true;
    }
  }

  const isDataDirty =
    isClassroomDirty ||
    !!newPassword ||
    checkIsTeacherDataDirty(teacherServerData, data);

  if (isDataDirty) {
    let updateClassroomData: Prisma.ClassroomUpdateOneWithoutHomeroomTeacherNestedInput =
      {};

    if (!data.homeroomClass?.grade && teacherServerData.homeroom?.grade) {
      updateClassroomData = {
        disconnect: true,
      };
    }

    if (isClassroomDirty) {
      updateClassroomData = {
        connect: {
          grade_major_section: {
            grade: data.homeroomClass?.grade as Grade,
            major: data.homeroomClass?.major as Major,
            section: data.homeroomClass?.section as ClassSection,
          },
        },
      };
    }

    let transformTeachingAssignments: Prisma.TeachingAssignmentUpdateManyWithoutTeacherNestedInput =
      {};

    if (data.teachingAssignments && data.teachingAssignments?.length > 0) {
      transformTeachingAssignments = {
        update: data.teachingAssignments.map((assignment) => ({
          where: { id: assignment.teachingAssignmentId },
          data: {
            class: {
              connect: {
                grade_major_section: {
                  grade: assignment.grade,
                  major: assignment.major,
                  section: assignment.section,
                },
              },
            },
            subject: {
              connect: { id: assignment.subjectId },
            },
          },
        })),
      };
    }

    const missingAssignments = findMissingTeachingAssignment(
      teacherServerData.assignments,
      data.teachingAssignments,
    ).filter((id) => id !== undefined && id !== null && id !== "");

    const teacherUpdateData = Prisma.validator<Prisma.TeacherUpdateInput>()({
      user: {
        update: {
          email: data.email,
          name: data.name,
          password: newPassword,
        },
      },
      assignments: {
        // Spread the object directly.
        // This adds the 'update: [...]' key automatically if it exists.
        ...transformTeachingAssignments,

        ...(missingAssignments.length > 0 && {
          disconnect: missingAssignments.map((id) => ({ id })),
        }),
      },
      homeroom: updateClassroomData,
    });

    await teacherUpdateOperation(teacherWhereUnique, teacherUpdateData, prisma);

    return {
      isTeacherUpdated: true,
    };
  } else {
    return {
      isTeacherUpdated: false,
    };
  }
};

export const getTeacherProfile = async (id: string) => {
  const teacherById = createTeacherWhereUnique({
    userId: id,
  });

  const selectTeacherData = createTeacherSelect({
    user: {
      select: {
        name: true,
        email: true,
      },
    },
    assignments: {
      include: {
        class: true,
        subject: true,
      },
    },
    homeroom: true,
  });

  const teacher = await findTeacher(teacherById, selectTeacherData, prisma);

  const tranformTeacher: TeacherUpdateSchema = {
    name: teacher?.user.name as string,
    email: teacher?.user.email as string,
    homeroomClass: {
      grade: teacher?.homeroom?.grade as Grade,
      major: teacher?.homeroom?.major as Major,
      section: teacher?.homeroom?.section as ClassSection,
    },
    teachingAssignments: (teacher?.assignments ?? []).map((assignment) => {
      return {
        grade: assignment.class.grade as Grade,
        major: assignment.class.major as Major,
        section: assignment.class.section as ClassSection,
        subjectId: assignment.subjectId as string,
        subjectName: assignment.subject.name as string,
        teachingAssignmentId: assignment.id as string,
      };
    }),
    passwordSchema: {
      confirmPassword: "",
      password: "",
    },
  };

  return { teacher: tranformTeacher };
};
