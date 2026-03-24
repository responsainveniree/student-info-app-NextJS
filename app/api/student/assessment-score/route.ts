import { prisma } from "@/db/prisma";
import { OFFSET, TAKE_RECORDS } from "@/lib/constants/pagination";
import { badRequest, handleError, notFound } from "@/lib/errors";
import { getSemester } from "@/lib/utils/date";
import { validateStudentSession } from "@/lib/validation/guards";
import { getStudentAssessmentScore } from "@/lib/zod/assessment";

export async function GET(req: Request) {
  try {
    const studentSession = await validateStudentSession();

    const { searchParams } = new URL(req.url);

    const rawData = Object.fromEntries(searchParams.entries());

    const data = getStudentAssessmentScore.parse(rawData);

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

    const [assessmentScores, totalRecords] = await Promise.all([
      prisma.assessmentScore.findMany({
        where: {
          gradebookId: gradebook.id,
        },
        select: {
          score: true,
          assessment: {
            select: {
              givenAt: true,
              dueAt: true,
              title: true,
              type: true,
            },
          },
        },
        skip: data.page * OFFSET,
        take: TAKE_RECORDS,
        orderBy: {
          assessment: {
            createdAt: "asc",
          },
        },
      }),
      prisma.assessmentScore.count({
        where: {
          gradebookId: gradebook.id,
        },
      }),
    ]);

    return Response.json(
      {
        message: "Successfully retrieved assessment score data",
        assessmentScores,
        totalRecords,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("API_ERROR", {
      route: "(GET) /api/student/assessment-score",
      message: error instanceof Error ? error.message : String(error),
    });
    return handleError(error);
  }
}
