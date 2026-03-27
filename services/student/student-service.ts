import { prisma } from "@/db/prisma";
import { StudentSession } from "@/domain/auth/role-guards";
import { MIN_SEARCH_LENGTH } from "@/lib/constants/pagination";
import { badRequest, notFound } from "@/lib/errors";
import { getSemester } from "@/lib/utils/date";
import { GetStudentAssessmentScoreSchema } from "@/lib/zod/assessment";
import { GetStudentExportSchema, StudentQuerySchema } from "@/lib/zod/student";
import {
  createAttendanceSelect,
  createAttendanceWhere,
  findAttendanceByStudentId,
} from "@/repositories/attendance-repository";
import { findUniqueClassroom } from "@/repositories/classroom-repository";
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
import {
  countStudent,
  createStudentSelect,
  createStudentWhere,
  findStudents,
} from "@/repositories/user-repository";
import { Prisma } from "@prisma/client";
import * as XLSX from "xlsx";

type Student = {
  user: {
    id: string;
    name: string;
  };
};

export const getStudents = async (data: StudentQuerySchema) => {
  let students: Student[], totalStudents: number;

  const selectUserIdAndName = createStudentSelect({
    user: {
      select: {
        id: true,
        name: true,
      },
    },
  });

  if (data.search?.length && data.search.length >= MIN_SEARCH_LENGTH) {
    const studentsByNameAndClass = createStudentWhere({
      user: {
        name: {
          mode: "insensitive",
          contains: data.search,
        },
      },
      class: {
        grade: data.grade,
        major: data.major,
        section: data.section,
      },
    });

    students = await findStudents(
      studentsByNameAndClass,
      selectUserIdAndName,
      data.isPaginationActive,
      data.page,
      prisma,
    );

    totalStudents = await countStudent(studentsByNameAndClass, prisma);
  } else {
    const studentsByClass = createStudentWhere({
      class: {
        grade: data.grade,
        major: data.major,
        section: data.section,
      },
    });

    students = await findStudents(
      studentsByClass,
      selectUserIdAndName,
      data.isPaginationActive,
      data.page,
      prisma,
    );

    totalStudents = await countStudent(studentsByClass, prisma);
  }

  return {
    students,
    totalStudents,
  };
};

export const getStudentProfile = async (studentSession: StudentSession) => {
  const attendanceByStudentId = createAttendanceWhere({
    studentId: studentSession.userId,
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
    studentId: studentSession.userId,
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
    where: { studentId: studentSession.userId },
  });

  return {
    attendanceRecords,
    demeritPointRecords,
    totalSubjects,
  };
};

export const getStudentExport = async (data: GetStudentExportSchema) => {
  const classroomByUniqueIdentifier =
    Prisma.validator<Prisma.ClassroomWhereUniqueInput>()({
      grade_major_section: {
        grade: data.grade,
        major: data.major,
        section: data.section,
      },
    });

  const selectClassroomWithStudents =
    Prisma.validator<Prisma.ClassroomSelect>()({
      students: {
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

  const studentRecords = await findUniqueClassroom(
    classroomByUniqueIdentifier,
    selectClassroomWithStudents,
    prisma,
  );

  if (studentRecords?.students.length === 0) {
    throw notFound("Student not found");
  }

  const studentsWorksheet = XLSX.utils.json_to_sheet(
    studentRecords?.students.map(
      (student: { user: { id: string; name: string } }) => student.user,
    ) as [],
  );
  const studentWorkbook = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(
    studentWorkbook,
    studentsWorksheet,
    "Student Data",
  );

  const studentBuffer = XLSX.write(studentWorkbook, {
    type: "buffer",
    bookType: "xlsx",
  });

  return {
    studentBuffer,
  };
};

export const getStudentSubject = async (studentSession: StudentSession) => {
  const subjectByConfig = createSubjectWhere({
    config: {
      allowedGrades: {
        has: studentSession.class?.grade,
      },
      allowedMajors: {
        has: studentSession.class?.major,
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
  studentSession: StudentSession,
) => {
  if (!data.subjectId)
    throw badRequest("Missing required query parameter: subjectId");

  const semester = getSemester(new Date()) === 1 ? "FIRST" : "SECOND";

  const gradebook = await prisma.gradebook.findUnique({
    where: {
      studentId_subjectId_semester: {
        studentId: studentSession.userId,
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
