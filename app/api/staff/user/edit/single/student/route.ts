import { validateManagementSession } from "@/domain/auth/role-guards";
import { handleError } from "@/lib/errors";
import { printConsoleError } from "@/lib/utils/printError";
import { updateStudentProfileSchema } from "@/lib/zod/student";
import { editSingleStudent } from "@/services/student/student-service";

export async function PATCH(req: Request) {
  try {
    await validateManagementSession();

    const rawData = await req.json();
    const data = updateStudentProfileSchema.parse(rawData);

    const response = await editSingleStudent(data);

    return Response.json(
      {
        message: "Student data updated successfully",
        data: {
          studentId: response.studentId,
        },
      },
      { status: 200 },
    );
  } catch (error) {
    printConsoleError(error, "PATCH", "/api/staff/edit-user/single/student");
    return handleError(error);
  }
}
