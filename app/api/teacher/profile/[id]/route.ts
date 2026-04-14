import { validateLoginSession } from "@/domain/auth/role-guards";
import { getTeacherProfile } from "@/features/teacher/server/services/teacher-service";
import { badRequest, handleError } from "@/lib/errors";
import { printConsoleError } from "@/lib/utils/printError";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await validateLoginSession();

    const { id } = await params;

    if (!id) throw badRequest("Id is missing");

    const response = await getTeacherProfile(id);

    return Response.json(
      {
        message: "Teacher profile successfully retrieved",
        teacher: response.teacher ?? {},
      },
      { status: 200 },
    );
  } catch (error) {
    printConsoleError(error, "GET", "/api/teacher/profile/[id]");
    handleError(error);
  }
}
