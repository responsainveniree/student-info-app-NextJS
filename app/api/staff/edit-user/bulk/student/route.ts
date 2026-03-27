import { validateManagementSession } from "@/domain/auth/role-guards";
import { handleError } from "@/lib/errors";
import { printConsoleError } from "@/lib/utils/printError";
import { updateStudentsClassSchema } from "@/lib/zod/student";
import { editBulkStudent } from "@/services/student/student-service";

export async function PATCH(req: Request) {
  try {
    await validateManagementSession();

    const rawData = await req.json();

    const data = updateStudentsClassSchema.parse(rawData);

    await editBulkStudent(data);

    return Response.json(
      {
        message: "Successfully updated students' class data",
      },
      { status: 200 },
    );
  } catch (error) {
    printConsoleError(error, "PATCH", "/api/staff/edit-user/bulk/student");
    return handleError(error);
  }
}
