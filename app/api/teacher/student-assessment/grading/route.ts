import { printConsoleError } from "@/lib/utils/printError";
import { handleError } from "../../../../../lib/errors";
import { validateTeacherSession } from "../../../../../lib/validation/guards";
import { updateAssessmentScoresSchema } from "@/lib/zod/assessment";
import { updateStudentAssessmentScore } from "@/services/assessment/student-assessment-service";

export async function PATCH(req: Request) {
  try {
    const teacherSession = await validateTeacherSession();

    const rawData = await req.json();
    const data = updateAssessmentScoresSchema.parse(rawData);

    await updateStudentAssessmentScore(data, teacherSession);

    return Response.json(
      { message: "Successfully updated students' marks" },
      { status: 201 },
    );
  } catch (error) {
    printConsoleError(
      error,
      "PATCH",
      "/api/teacher/student-assessment/grading",
    );
    return handleError(error);
  }
}
