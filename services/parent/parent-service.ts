import { prisma } from "@/db/prisma";
import { ParentSession } from "@/domain/auth/role-guards";
import { badRequest, notFound } from "@/lib/errors";
import { getSemester } from "@/lib/utils/date";
import { GetStudentAssessmentScoreSchema } from "@/lib/zod/assessment";
import {
  createAttendanceSelect,
  createAttendanceWhere,
  findAttendanceByStudentId,
} from "@/repositories/attendance-repository";
import {
  createDemeritPointSelect,
  createDemeritPointWhere,
  findDemeritPoints,
} from "@/repositories/demerit-repository";
import {
  countAssessmentScore,
  createAssessmentScoreSelect,
  createAssessmentScoreWhere,
  findAsessmentScores,
} from "@/repositories/student-assessment-score-repository";
import {
  createSubjectSelect,
  createSubjectWhere,
  findSubjects,
} from "@/repositories/subject-repository";

export const getStudentProfile = async (parentSession: ParentSession) => {
  const attendanceByStudentId = createAttendanceWhere({
    studentId: parentSession.studentId,
  });

  const selectDateAndType = createAttendanceSelect({
    date: true,
    type: true,
  });

  const attendanceRecords = await findAttendanceByStudentId(
    attendanceByStudentId,
    selectDateAndType,
    prisma,
  );

  const demeritPointByStudentId = createDemeritPointWhere({
    studentId: parentSession.studentId,
  });

  const selectDemeritPointData = createDemeritPointSelect({
    description: true,
    category: true,
    points: true,
    date: true,
  });

  const demeritPointRecords = await findDemeritPoints(
    demeritPointByStudentId,
    selectDemeritPointData,
    prisma,
  );

  const totalSubjects = await prisma.gradebook.count({
    where: { studentId: parentSession.studentId },
  });

  return {
    attendanceRecords,
    demeritPointRecords,
    totalSubjects,
  };
};

export const getStudentSubject = async (parentSession: ParentSession) => {
  const subjectByConfig = createSubjectWhere({
    config: {
      allowedGrades: {
        has: parentSession.student?.class?.grade,
      },
      allowedMajors: {
        has: parentSession.student?.class?.major,
      },
    },
  });

  const selectSubjectIdAndName = createSubjectSelect({
    id: true,
    name: true,
  });

  const subjects = await findSubjects(
    prisma,
    subjectByConfig,
    selectSubjectIdAndName,
    true,
    "asc",
    undefined,
  );

  return {
    subjects,
  };
};

export const getStudentAssessmentScore = async (
  data: GetStudentAssessmentScoreSchema,
  parentSession: ParentSession,
) => {
  if (!data.subjectId)
    throw badRequest("Missing required query parameter: subjectId");

  const semester = getSemester(new Date()) === 1 ? "FIRST" : "SECOND";

  const gradebook = await prisma.gradebook.findUnique({
    where: {
      studentId_subjectId_semester: {
        studentId: parentSession.studentId,
        subjectId: data.subjectId,
        semester: semester,
      },
    },
    select: {
      id: true,
    },
  });

  if (!gradebook?.id) throw notFound("Gradebook not found");

  const assessmentScoreByGradebookId = createAssessmentScoreWhere({
    gradebookId: gradebook.id,
  });

  const assessmentScoreWithAssessmentData = createAssessmentScoreSelect({
    score: true,
    assessment: {
      select: {
        givenAt: true,
        dueAt: true,
        title: true,
        type: true,
      },
    },
  });

  const [assessmentScores, totalRecords] = await Promise.all([
    findAsessmentScores(
      assessmentScoreByGradebookId,
      assessmentScoreWithAssessmentData,
      data.page,
      prisma,
    ),
    countAssessmentScore(assessmentScoreByGradebookId, prisma),
  ]);

  return {
    assessmentScores,
    totalRecords,
  };
};
