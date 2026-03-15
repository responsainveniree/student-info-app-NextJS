import { prisma } from "@/db/prisma";
import { handleError, notFound } from "@/lib/errors";
import { getSemester } from "@/lib/utils/date";
import { updateStudentsClassSchema } from "@/lib/utils/zodSchema";
import { validateManagementSession } from "@/lib/validation/guards";
import { Prisma } from "@prisma/client";

export async function PATCH(req: Request) {
  try {
    await validateManagementSession();

    const rawData = await req.json();

    const data = updateStudentsClassSchema.parse(rawData);

    const newGradebookToCreate: Prisma.GradebookCreateManyInput[] = [];
    const [updatedClassroom, allSubjects] = await Promise.all([
      await prisma.classroom.findUnique({
        where: {
          id: data.updatedClassId,
        },
      }),
      await prisma.subject.findMany({ include: { config: true } }),
    ]);

    if (!updatedClassroom) {
      throw notFound("Classroom data not found");
    }

    if (allSubjects.length === 0) {
      throw notFound("Subjects data not found");
    }

    const currentDate = new Date();
    const semester = getSemester(currentDate);
    const transformSemester = semester == 1 ? "FIRST" : "SECOND";

    for (const studentId of data.studentIds) {
      const relevantSubjects = allSubjects.filter((subject) => {
        const isGradeAllowed = subject.config.allowedGrades.includes(
          updatedClassroom.grade as any,
        );
        const isMajorAllowed = subject.config.allowedMajors.includes(
          updatedClassroom.major as any,
        );
        return isGradeAllowed && isMajorAllowed;
      });
      for (const subject of relevantSubjects) {
        newGradebookToCreate.push({
          studentId: studentId,
          subjectId: subject.id,
          semester: transformSemester,
        });
      }
    }

    await prisma.$transaction(async (tx) => {
      await tx.student.updateMany({
        where: {
          userId: {
            in: data.studentIds,
          },
        },
        data: {
          classId: data.updatedClassId,
        },
      });

      await prisma.gradebook.deleteMany({
        where: {
          studentId: {
            in: data.studentIds,
          },
        },
      });

      await prisma.gradebook.createMany({
        data: newGradebookToCreate,
      });
    });

    return Response.json(
      {
        message: "Successfully updated students' class data",
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("API_ERROR", {
      route: "(POST) /api/staff/edit-user/bulk/student",
      message: error instanceof Error ? error.message : String(error),
    });
    return handleError(error);
  }
}
