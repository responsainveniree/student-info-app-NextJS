import { prisma } from "@/db/prisma";
import { StudentSession } from "@/domain/auth/role-guards";
import { MIN_SEARCH_LENGTH } from "@/lib/constants/pagination";
import { badRequest, notFound } from "@/lib/errors";
import { getSemester } from "@/lib/utils/date";
import hashing from "@/lib/utils/hashing";
import { GetStudentAssessmentScoreSchema } from "@/lib/zod/assessment";
import {
  GetStudentExportSchema,
  StudentQuerySchema,
  UpdateStudentProfileSchema,
  UpdateStudentsClassSchema,
} from "@/lib/zod/student";
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
  createUserWhereUnique,
  findStudents,
  updateSingleUser,
} from "@/repositories/user-repository";
import { Prisma } from "@prisma/client";
import * as XLSX from "xlsx";

export type Student = {
  user: {
    id: string;
    name: string;
    email: string;
  };
};

export const getStudents = async (data: StudentQuerySchema) => {
  const selectUserData = createStudentSelect({
    user: {
      select: {
        id: true,
        name: true,
        email: true,
      },
    },
  });

  const where: Prisma.StudentWhereInput = {
    class: {
      grade: data.grade,
      major: data.major,
      section: data.section,
    },
  };

  if (data.search && data.search.length >= MIN_SEARCH_LENGTH) {
    where.user = {
      name: { contains: data.search, mode: "insensitive" },
    };
  }

  // 2. Execute in parallel
  const [students, totalStudents] = await Promise.all([
    findStudents(
      where,
      selectUserData,
      data.isPaginationActive,
      data.page,
      prisma,
    ),
    countStudent(where, prisma),
  ]);

  return { students, totalStudents };
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

export const editSingleStudent = async (data: UpdateStudentProfileSchema) => {
  const studentById = createUserWhereUnique({
    id: data.id,
  });

  let password: null | string = null;

  if (
    data.passwordSchema?.password &&
    data.passwordSchema.confirmPassword &&
    data.passwordSchema.password === data.passwordSchema.confirmPassword
  ) {
    password = await hashing(data.passwordSchema.password);
  }

  const updateData = Prisma.validator<Prisma.UserUpdateInput>()({
    name: data.name,
    password: password ? data.passwordSchema!.password : undefined,
    email: data.email,
    studentProfile: {
      update: {
        studentRole: data.role,
        class: {
          connect: {
            grade_major_section: {
              grade: data.classSchema.grade,
              major: data.classSchema.major,
              section: data.classSchema.section,
            },
          },
        },
      },
    },
  });

  await updateSingleUser(studentById, updateData, prisma);

  return {
    studentId: data.id,
  };
};

export const editBulkStudent = async (data: UpdateStudentsClassSchema) => {
  const newGradebookToCreate: Prisma.GradebookCreateManyInput[] = [];
  const [updatedClassroom, allSubjects] = await Promise.all([
    await prisma.classroom.findUnique({
      where: {
        id: data.updatedClassId,
      },
    }),
    await prisma.subject.findMany({ include: { config: true } }),
  ]);

  if (!updatedClassroom) {
    throw notFound("Classroom data not found");
  }

  if (allSubjects.length === 0) {
    throw notFound("Subjects data not found");
  }

  const currentDate = new Date();
  const semester = getSemester(currentDate);
  const transformSemester = semester == 1 ? "FIRST" : "SECOND";

  for (const studentId of data.studentIds) {
    const relevantSubjects = allSubjects.filter((subject) => {
      const isGradeAllowed = subject.config.allowedGrades.includes(
        updatedClassroom.grade as any,
      );
      const isMajorAllowed = subject.config.allowedMajors.includes(
        updatedClassroom.major as any,
      );
      return isGradeAllowed && isMajorAllowed;
    });
    for (const subject of relevantSubjects) {
      newGradebookToCreate.push({
        studentId: studentId,
        subjectId: subject.id,
        semester: transformSemester,
      });
    }
  }

  await prisma.$transaction(async (tx) => {
    await tx.student.updateMany({
      where: {
        userId: {
          in: data.studentIds,
        },
      },
      data: {
        classId: data.updatedClassId,
      },
    });

    await prisma.gradebook.deleteMany({
      where: {
        studentId: {
          in: data.studentIds,
        },
      },
    });

    await prisma.gradebook.createMany({
      data: newGradebookToCreate,
    });
  });
};
