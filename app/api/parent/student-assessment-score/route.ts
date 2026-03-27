import { validateParentSession } from "@/domain/auth/role-guards";
import { handleError } from "@/lib/errors";
import { printConsoleError } from "@/lib/utils/printError";
import { getStudentAssessmentScoreSchema } from "@/lib/zod/assessment";
import { getStudentAssessmentScore } from "@/services/parent/parent-service";

export async function GET(req: Request) {
  try {
    const parentSession = await validateParentSession();

    const { searchParams } = new URL(req.url);

    const rawData = Object.fromEntries(searchParams.entries());

    const data = getStudentAssessmentScoreSchema.parse(rawData);

    const response = await getStudentAssessmentScore(data, parentSession);

    return Response.json(
      {
        message: "Successfully retrieved assessment score data",
        response: response.assessmentScores,
      },
      { status: 200 },
    );
  } catch (error) {
    printConsoleError(error, "GET", "/api/parent/student-assessment-score");
    return handleError(error);
  }
}
