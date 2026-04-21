import { handleError } from "@/lib/errors";
import { getStudentExport } from "@/services/student/student-service";
import { getStudentExportSchema } from "@/lib/zod/student";
import { printConsoleError } from "@/lib/utils/printError";
import { validateManagementSession } from "@/domain/auth/role-guards";
import { getFullClassLabel } from "@/lib/utils/labels";

export async function GET(req: Request) {
  try {
    await validateManagementSession();

    const { searchParams } = new URL(req.url);

    const rawData = Object.fromEntries(searchParams.entries());

    const data = getStudentExportSchema.parse(rawData);

    const response = await getStudentExport(data);

    return new Response(response.studentBuffer, {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename=Student-${getFullClassLabel(data.grade, data.major, data.section)}.xlsx"`,
      },
    });
  } catch (error) {
    printConsoleError(error, "GET", "/api/staff/export-students");
    return handleError(error);
  }
}
