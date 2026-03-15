import { handleError } from "../../../../../../lib/errors";
import { validateManagementSession } from "../../../../../../lib/validation/guards";
import { studentSignUpSchema } from "../../../../../../lib/utils/zodSchema";
import { createStudentAccountService } from "../../../../../../services/student/createStudentAccountService";

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
      { status: 200 },
    );
  } catch (error) {
    return handleError(error);
  }
}
