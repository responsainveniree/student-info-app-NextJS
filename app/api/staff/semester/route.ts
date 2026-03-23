import { handleError } from "@/lib/errors";
import { printConsoleError } from "@/lib/utils/printError";
import { validateManagementSession } from "@/lib/validation/guards";
import { updateSemseter } from "@/services/semester/semester-service";

export async function PATCH() {
  try {
    await validateManagementSession();

    const response = await updateSemseter();

    return Response.json(
      {
        message: `Semseter updated successfully. Now it's ${response.currentSemester ? "1" : "2"} semester`,
      },
      { status: 200 },
    );
  } catch (error) {
    printConsoleError(error, "PATCH", "/api/staff/semester");
    return handleError(error);
  }
}
