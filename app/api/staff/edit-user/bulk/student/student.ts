import { handleError } from "@/lib/errors";
import { updateStudentsClassSchema } from "@/lib/utils/zodSchema";
import { validateManagementSession } from "@/lib/validation/guards";

export async function PATCH(req: Request) {
  try {
    await validateManagementSession();

    const rawData = await req.json();

    const data = updateStudentsClassSchema.parse(rawData);
  } catch (error) {
    console.error("API_ERROR", {
      route: "(POST) /api/staff/edit-user/bulk/student",
      message: error instanceof Error ? error.message : String(error),
    });
    return handleError(error);
  }
}
