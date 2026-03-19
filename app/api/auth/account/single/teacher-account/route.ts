import { createTeacherAccountService } from "../../../../../../services/teacher/createTeacherAccountService";
import { handleError } from "../../../../../../lib/errors";
import { validateManagementSession } from "../../../../../../lib/validation/guards";
import { teacherSignUpSchema } from "../../../../../../lib/zod/teacher";
import { printConsoleError } from "@/lib/utils/printError";

export async function POST(req: Request) {
  try {
    await validateManagementSession();

    const rawData = await req.json();
    const data = teacherSignUpSchema.parse(rawData);

    await createTeacherAccountService(data);

    return Response.json(
      {
        message: "Teacher account successfully created",
      },
      { status: 201 },
    );
  } catch (error) {
    printConsoleError(
      error,
      "POST",
      "/api/auth/account/single/teacher-account",
    );
    return handleError(error);
  }
}
