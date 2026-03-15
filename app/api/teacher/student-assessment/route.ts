import { badRequest, handleError, notFound } from "@/lib/errors";
import { getFullClassLabel } from "@/lib/utils/labels";
import {
  createStudentAssessmentSchema,
  getStudentAssessmentSchema,
  updateStudentAssessmentSchema,
} from "@/lib/utils/zodSchema";
import { prisma } from "@/db/prisma";
import { validateTeacherSession } from "@/lib/validation/guards";
import { Prisma } from "@prisma/client";
import { ClassSection, Grade, Major } from "@/lib/constants/class";

export async function POST(req: Request) {
  try {
    const teacherSession = await validateTeacherSession();

    const rawData = await req.json();
    const data = createStudentAssessmentSchema.parse(rawData);

    const studentRecords = await prisma.student.findMany({
      where: {
        class: {
          grade: data.class.grade,
          major: data.class.major,
          section: data.class.section,
        },
      },
      select: {
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
      },
    });

    if (studentRecords.length === 0) {
      throw notFound("Student data not found");
    }

    const teachingAssignment = await prisma.teachingAssignment.findUnique({
      where: {
        teacherId_subjectId_classId: {
          teacherId: teacherSession.userId,
          subjectId: data.subjectId,
          classId: studentRecords[0].classId as number,
        },
      },
      select: {
        id: true,
        totalAssignmentAssigned: true,
      },
    });

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

    const assessmentScoresToCreate: Prisma.AssessmentScoreCreateManyInput[] =
      [];

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

    return Response.json(
      {
        message: `Successfully created new assignment column for subject ${data.subjectName} in ${classLabel}`,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("API_ERROR", {
      route: "(POST) /api/teacher/student-assessment",
      message: error instanceof Error ? error.message : String(error),
    });
    return handleError(error);
  }
}

export async function GET(req: Request) {
  try {
    const teacherSession = await validateTeacherSession();

    const { searchParams } = new URL(req.url);

    const rawData = Object.fromEntries(searchParams.entries());
    const data = getStudentAssessmentSchema.parse(rawData);

    const classroom = await prisma.classroom.findUnique({
      where: {
        grade_major_section: {
          grade: data.grade,
          major: data.major,
          section: data.section,
        },
      },
      select: {
        id: true,
      },
    });

    if (!classroom) {
      throw notFound("Classroom not found");
    }

    const teachingAssingnment = await prisma.teachingAssignment.findUnique({
      where: {
        teacherId_subjectId_classId: {
          teacherId: teacherSession.userId,
          subjectId: data.subjectId,
          classId: classroom.id,
        },
      },
      select: {
        id: true,
      },
    });

    if (!teachingAssingnment) throw notFound("Teaching assignment not found");

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

    return Response.json(
      {
        message: "Students' assessment data retrieved successfully",
        assessments,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("API_ERROR", {
      route: "(GET) /api/teacher/student-assessment",
      message: error instanceof Error ? error.message : String(error),
    });
    return handleError(error);
  }
}

export async function PATCH(req: Request) {
  try {
    await validateTeacherSession();

    const rawData = await req.json();
    const data = updateStudentAssessmentSchema.parse(rawData);

    const assessment = await prisma.assessment.findUnique({
      where: {
        id: data.assessmentId,
      },
      select: {
        id: true,
      },
    });

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

    return Response.json(
      {
        message: "Assessment data updated successfully",
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("API_ERROR", {
      route: "(DELETE) /api/teacher/student-assessment",
      message: error instanceof Error ? error.message : String(error),
    });
    return handleError(error);
  }
}

export async function DELETE(req: Request) {
  try {
    await validateTeacherSession();

    const { searchParams } = new URL(req.url);

    const assessmentIdParam = Number(searchParams.get("assessmentId"));
    const teachingAssignmentIdParam = Number(
      searchParams.get("teachingAssignmentId"),
    );

    if (!assessmentIdParam || !teachingAssignmentIdParam) {
      throw badRequest("Assessment id or teaching assignment id is missing");
    }

    await prisma.assessment.delete({
      where: {
        id: assessmentIdParam,
      },
    });

    await prisma.teachingAssignment.update({
      where: {
        id: teachingAssignmentIdParam,
      },
      data: {
        totalAssignmentAssigned: { decrement: 1 },
      },
    });

    return Response.json(
      {
        message: "Assessment data deleted successfully",
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("API_ERROR", {
      route: "(DELETE) /api/teacher/student-assessment",
      message: error instanceof Error ? error.message : String(error),
    });
    return handleError(error);
  }
}
