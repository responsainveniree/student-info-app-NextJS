import { validateParentSession } from "@/domain/auth/role-guards";
import { handleError } from "@/lib/errors";
import { printConsoleError } from "@/lib/utils/printError";
import { getStudentSubject } from "@/services/parent/parent-service";

export async function GET() {
  try {
    const parentSession = await validateParentSession();

    const response = await getStudentSubject(parentSession);

    return Response.json(
      {
        message: "Successfully retrieved subject data",
        subjects: response.subjects,
      },
      { status: 200 },
    );
  } catch (error) {
    printConsoleError(error, "GET", "/api/parent/student-subject");
    return handleError(error);
  }
}
