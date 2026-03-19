import { createStudentBulkAccountService } from "@/services/student/createStudentBulkAccountService";
import { badRequest, handleError } from "../../../../../../lib/errors";
import { validateManagementSession } from "../../../../../../lib/validation/guards";
import { printConsoleError } from "@/lib/utils/printError";
import { validateExcelExtension } from "@/domain/extension/extensionRules";

export async function POST(req: Request) {
  try {
    await validateManagementSession();

    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) throw badRequest("No file uploaded");

    validateExcelExtension(file);

    const response = await createStudentBulkAccountService(file);

    return response;
  } catch (error) {
    printConsoleError(error, "POST", "/api/auth/account/bulk/student-accounts");
    return handleError(error);
  }
}
