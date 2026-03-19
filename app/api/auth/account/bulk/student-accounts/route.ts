import { createStudentBulkAccountService } from "@/services/student/createStudentBulkAccountService";
import { badRequest, handleError } from "../../../../../../lib/errors";
import { validateManagementSession } from "../../../../../../lib/validation/guards";
import { printConsoleError } from "@/lib/utils/printError";

export async function POST(req: Request) {
  try {
    await validateManagementSession();

    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) throw badRequest("No file uploaded");

    const response = await createStudentBulkAccountService(file);

    return response;
  } catch (error) {
    printConsoleError(error, "POST", "/api/auth/account/bulk/student-accounts");
    return handleError(error);
  }
}
