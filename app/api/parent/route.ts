import { badRequest, handleError, notFound } from "@/lib/errors";
import { prisma } from "@/prisma/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const parentIdParam = searchParams.get("parentId");

    if (!parentIdParam) {
      throw badRequest("Missing required parameter.");
    }

    const existingParent = await prisma.parent.findUnique({
      where: { id: parentIdParam },
      select: {
        studentId: true,
        student: {
          select: {
            name: true,
            studentSubjects: true,
          },
        },
      },
    });

    if (!existingParent) {
      throw notFound("User not found");
    }

    const attendanceStats = await prisma.studentAttendance.findMany({
      where: { studentId: existingParent.studentId },
      select: {
        date: true,
        type: true,
      },
    });

    return Response.json(
      {
        mesasge: "Successfully retrieved student attendance stats for parents",
        data: {
          studentName: existingParent.student.name,
          studentSubjects: existingParent.student.studentSubjects,
          attendanceStats,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(`Error in parent api: ${error}`);
    return handleError(error);
  }
}
