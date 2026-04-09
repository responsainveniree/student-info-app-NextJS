import { validateManagementSession } from "@/domain/auth/role-guards";
import { TEACHER_FETCH_TYPE, TeacherFetchType } from "@/lib/constants/teacher";
import { badRequest, handleError } from "@/lib/errors";
import { printConsoleError } from "@/lib/utils/printError";
import { getTeachers } from "@/features/teacher/server/services/teacher-service";

export async function GET(req: Request) {
  try {
    await validateManagementSession();

    const { searchParams } = new URL(req.url);
    /**
     * Fetches teachers based on homeroom status.
     * @query get - 'all' to fetch every teachers, 'nonHomeroom' for teachers that aren't homeroom teacher only.
     */
    const teacherFetchType = searchParams.get("get");

    if (!teacherFetchType)
      throw badRequest("Teacher featch type parameter is empty");

    if (!TEACHER_FETCH_TYPE.includes(teacherFetchType as any)) {
      throw badRequest("Invalid fetch type. Use 'all' or 'nonHomeroom'.");
    }

    const teachers = await getTeachers(teacherFetchType as TeacherFetchType);

    return Response.json(
      {
        message: "Teachers data retrieved successfully",
        data: teachers ?? [],
      },
      { status: 200 },
    );
  } catch (error) {
    printConsoleError(error, "GET", "/api/teacher");
    return handleError(error);
  }
}
