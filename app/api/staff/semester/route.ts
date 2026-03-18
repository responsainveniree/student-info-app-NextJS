import { prisma } from "@/db/prisma";
import { badRequest, handleError } from "@/lib/errors";
import { getSemester } from "@/lib/utils/date";
import { validateManagementSession } from "@/lib/validation/guards";

export async function PATCH() {
  try {
    await validateManagementSession();

    const currentDate = new Date();
    const semester = getSemester(currentDate);
    const transformSemester = semester == 1 ? "FIRST" : "SECOND";

    // Check database semester
    let databaseSemester = await prisma.gradebook.findFirst({
      select: {
        semester: true,
      },
    });

    if (!databaseSemester) databaseSemester = { semester: "FIRST" };

    if (transformSemester === databaseSemester.semester) {
      throw badRequest(
        `You can't update the semester now. It's still in the ${semester} scope`,
      );
    }

    await prisma.assessment.deleteMany();

    await prisma.gradebook.updateMany({
      data: {
        semester: transformSemester,
      },
    });
  } catch (error) {
    console.error("API_ERROR", {
      route: "(PATCH) /api/staff/semester",
      message: error instanceof Error ? error.message : String(error),
    });
    return handleError(error);
  }
}
