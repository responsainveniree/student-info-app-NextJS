import { prisma } from "@/db/prisma";
import { handleError } from "../../../../../../lib/errors";
import { updateStudentProfileSchema } from "../../../../../../lib/utils/zodSchema";
import { validateManagementSession } from "../../../../../../lib/validation/guards";

export async function PATCH(req: Request) {
  try {
    await validateManagementSession();

    const rawData = await req.json();
    const data = updateStudentProfileSchema.parse(rawData);

    await prisma.user.update({
      where: {
        id: data.id,
      },
      data: {
        name: data.name,
        studentProfile: {
          update: {
            studentRole: data.role,
            class: {
              connect: {
                grade_major_section: {
                  grade: data.classSchema.grade,
                  major: data.classSchema.major,
                  section: data.classSchema.section,
                },
              },
            },
          },
        },
      },
    });

    return Response.json({ message: "Student data updated successfully" });
  } catch (error) {
    console.error("API_ERROR", {
      route: "(POST) /api/staff/edit-user/student",
      message: error instanceof Error ? error.message : String(error),
    });
    return handleError(error);
  }
}
