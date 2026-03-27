import { prisma } from "@/db/prisma";
import { handleError } from "../../../../../../lib/errors";
import { validateManagementSession } from "@/domain/auth/role-guards";
import { printConsoleError } from "@/lib/utils/printError";
import { updateStudentProfileSchema } from "@/lib/zod/student";
import { editSingleStudent } from "@/services/student/student-service";

export async function PATCH(req: Request) {
  try {
    await validateManagementSession();

    const rawData = await req.json();
    const data = updateStudentProfileSchema.parse(rawData);

    await editSingleStudent(data);

    return Response.json(
      { message: "Student data updated successfully" },
      { status: 200 },
    );
  } catch (error) {
    printConsoleError(error, "PATCH", "/api/staff/edit-user/single/student");
    return handleError(error);
  }
}
