import { studentSignUpSchema } from "../../../../../../lib/zod/student";
import { handleError } from "../../../../../../lib/errors";
import { validateManagementSession } from "../../../../../../lib/validation/guards";
import { createStudentAccountService } from "../../../../../../services/student/createStudentAccountService";
import { printConsoleError } from "@/lib/utils/printError";

export async function POST(req: Request) {
  try {
    await validateManagementSession();

    const raw = await req.json();
    const data = studentSignUpSchema.parse(raw);

    const result = await createStudentAccountService(data);

    return Response.json(
      {
        message: "Student account created successfully",
        data: result,
      },
      { status: 201 },
    );
  } catch (error) {
    printConsoleError(
      error,
      "POST",
      "/api/auth/account/single/student-account",
    );
    return handleError(error);
  }
}
