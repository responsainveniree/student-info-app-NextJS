import { prisma } from "@/db/prisma";
import { TeacherSession } from "@/domain/types/sessions";
import { ClassSection, Grade, Major } from "@/lib/constants/class";
import { badRequest, notFound } from "@/lib/errors";
import { getFullClassLabel } from "@/lib/utils/labels";
import {
  CreateStudentAssessmentSchema,
  GetStudentAssessmentSchema,
  UpdateAssessmentScoresSchema,
  UpdateStudentAssessmentSchema,
} from "@/lib/zod/assessment";
import {
  createAssessmentSelect,
  createAssessmentWhere,
  createAssessmentWhereUnique,
  findAssessments,
  findUniqueAssessment,
} from "@/repositories/student-assessment-repository";
import {
  createClassroomSelect,
  createClassroomWhereUnique,
  findUniqueClassroom,
} from "@/repositories/classroom-repository";
import {
  createTeachingAssignmentSelect,
  createTeachingAssignmentWhereUnique,
  findUniqueTeachingAssignment,
} from "@/repositories/teaching-assignment-repository";
import { findStudents } from "@/repositories/user-repository";
import { Prisma } from "@prisma/client";

export const createStudentAssessment = async (
  data: CreateStudentAssessmentSchema,
  teacherSession: TeacherSession,
) => {
  const studentByClass = Prisma.validator<Prisma.StudentWhereInput>()({
    class: {
      grade: data.class.grade,
      major: data.class.major,
      section: data.class.section,
    },
  });

  const studentWithGradebookSelect = Prisma.validator<Prisma.StudentSelect>()({
    classId: true,
    user: {
      select: {
        id: true,
      },
    },
    gradebooks: {
      where: {
        subjectId: data.subjectId,
      },
      select: {
        id: true,
      },
    },
  });

  const studentRecords = await findStudents(
    studentByClass,
    studentWithGradebookSelect,
    prisma,
  );

  if (studentRecords.length === 0) {
    throw notFound("Student data not found");
  }

  const teachingAssignmentByUniqueIdentifier =
    Prisma.validator<Prisma.TeachingAssignmentWhereUniqueInput>()({
      teacherId_subjectId_classId: {
        teacherId: teacherSession.userId,
        subjectId: data.subjectId,
        classId: studentRecords[0].classId as number,
      },
    });

  const selectTotalAssignmentAndId =
    Prisma.validator<Prisma.TeachingAssignmentSelect>()({
      id: true,
      totalAssignmentAssigned: true,
    });

  const teachingAssignment = await findUniqueTeachingAssignment(
    teachingAssignmentByUniqueIdentifier,
    selectTotalAssignmentAndId,
    prisma,
  );

  if (!teachingAssignment) {
    throw badRequest("Teaching assignment not found");
  }

  const parseGivenAt = new Date(data.description.givenAt);
  const parseDueAt = new Date(data.description.dueAt);

  const assessment = await prisma.assessment.create({
    data: {
      teachingAssignmentId: teachingAssignment.id,
      title: data.description.title,
      givenAt: parseGivenAt,
      dueAt: parseDueAt,
      type: data.assessmentType,
    },
  });

  const assessmentScoresToCreate: Prisma.AssessmentScoreCreateManyInput[] = [];

  for (const student of studentRecords) {
    assessmentScoresToCreate.push({
      gradebookId: student.gradebooks[0].id,
      teacherId: teacherSession.userId,
      assessmentId: assessment.id,
      studentId: student.user.id,
    });
  }

  await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    await tx.teachingAssignment.update({
      where: {
        teacherId_subjectId_classId: {
          classId: studentRecords[0].classId as number,
          teacherId: teacherSession.userId,
          subjectId: data.subjectId,
        },
      },
      data: {
        totalAssignmentAssigned: {
          increment: 1,
        },
      },
    });

    await tx.assessmentScore.createMany({
      data: assessmentScoresToCreate,
      skipDuplicates: true,
    });
  });

  const classLabel = getFullClassLabel(
    data.class.grade as Grade,
    data.class.major as Major,
    data.class.section as ClassSection,
  );

  return {
    classLabel,
  };
};

export const getStudentAssessment = async (
  data: GetStudentAssessmentSchema,
  teacherSession: TeacherSession,
) => {
  const classroomByUniqueIdentifier = createClassroomWhereUnique({
    grade_major_section: {
      grade: data.grade,
      major: data.major,
      section: data.section,
    },
  });

  const selectClassroomId = createClassroomSelect({
    id: true,
  });

  const classroom = await findUniqueClassroom(
    classroomByUniqueIdentifier,
    selectClassroomId,
    prisma,
  );

  if (!classroom) {
    throw notFound("Classroom not found");
  }

  const teachingAssignmentByUniqueIdentifier =
    createTeachingAssignmentWhereUnique({
      teacherId_subjectId_classId: {
        teacherId: teacherSession.userId,
        subjectId: data.subjectId,
        classId: classroom.id,
      },
    });

  const selectTeachingAssignmentId = createTeachingAssignmentSelect({
    id: true,
  });

  const teachingAssingnment = await prisma.teachingAssignment.findUnique({
    where: teachingAssignmentByUniqueIdentifier,
    select: selectTeachingAssignmentId,
  });

  if (!teachingAssingnment) throw notFound("Teaching assignment not found");

  // I don't put it into repository file because I only use it for once
  const assessments = await prisma.assessment.findMany({
    where: {
      teachingAssignmentId: teachingAssingnment.id,
    },
    include: {
      scores: {
        select: {
          student: {
            select: {
              user: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
          id: true,
          score: true,
        },
      },
    },
  });

  return {
    assessments,
  };
};

export const updateStudentAssessment = async (
  data: UpdateStudentAssessmentSchema,
) => {
  const assessmentById = createAssessmentWhereUnique({
    id: data.assessmentId,
  });

  const selectAssessmentId = createAssessmentSelect({
    id: true,
  });

  const assessment = await findUniqueAssessment(
    assessmentById,
    selectAssessmentId,
    prisma,
  );

  if (!assessment) throw notFound("Assessment not found");

  await prisma.assessment.update({
    where: {
      id: assessment.id,
    },
    data: {
      givenAt: new Date(data.descriptionSchema.givenAt),
      dueAt: new Date(data.descriptionSchema.dueAt),
      title: data.descriptionSchema.title,
      type: data.assessmentType,
    },
  });
};

export const deleteStudentAssessment = async (
  assessmentId: number,
  teachingAssignmentId: number,
) => {
  await prisma.assessment.delete({
    where: {
      id: assessmentId,
    },
  });

  await prisma.teachingAssignment.update({
    where: {
      id: teachingAssignmentId,
    },
    data: {
      totalAssignmentAssigned: { decrement: 1 },
    },
  });
};

export const updateStudentAssessmentScore = async (
  data: UpdateAssessmentScoresSchema,
  teacherSession: TeacherSession,
) => {
  const teachingAssignmentByUniqueIdentifier =
    createTeachingAssignmentWhereUnique({
      teacherId_subjectId_classId: {
        teacherId: teacherSession.userId,
        subjectId: data.subjectId,
        classId: data.classId,
      },
    });

  const teachingAssignmentById = createTeachingAssignmentSelect({
    id: true,
  });

  const teachingAssignment = await findUniqueTeachingAssignment(
    teachingAssignmentByUniqueIdentifier,
    teachingAssignmentById,
    prisma,
  );

  if (!teachingAssignment) throw notFound("Teaching assignment not found");

  await prisma.$transaction(
    async (tx: Prisma.TransactionClient) => {
      // Flatten the nested data into a linear array for easier processing within a single transaction.
      const updatePromises = data.students.flatMap((student) =>
        student.studentAssessments.map((assessment) => {
          return tx.assessmentScore.update({
            where: {
              id: assessment.assessmentScoreId,
              studentId: student.studentId,
            },
            data: {
              score: assessment.score,
            },
          });
        }),
      );

      await Promise.all(updatePromises);
    },
    {
      timeout: 15000,
    },
  );
};
