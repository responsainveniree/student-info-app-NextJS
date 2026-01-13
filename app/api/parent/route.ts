import { badRequest, handleError, notFound } from "@/lib/errors";
import { prisma } from "@/prisma/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const parentIdParam = searchParams.get("parentId");

    if (!parentIdParam) {
      throw badRequest("Missing required parameter.");
    }

    const parentWithStudent = await prisma.parent.findUnique({
      where: { id: parentIdParam },
      select: {
        studentId: true,
        student: {
          select: {
            name: true,
            id: true,
            grade: true,
            major: true,
            classNumber: true,
            studentSubjects: true,
          },
        },
      },
    });

    if (!parentWithStudent) {
      throw notFound("User not found");
    }

    const attendanceStats = await prisma.studentAttendance.findMany({
      where: { studentId: parentWithStudent.studentId },
      select: {
        date: true,
        type: true,
      },
    });

    const problemPointRecords = await prisma.problemPoint.findMany({
      where: { studentId: parentWithStudent.studentId },
      select: {
        description: true,
        category: true,
        point: true,
        date: true,
      },
    });

    return Response.json(
      {
        mesasge: "Successfully retrieved student attendance stats for parents",
        data: {
          studentName: parentWithStudent.student.name,
          student: {
            id: parentWithStudent.student.id,
            grade: parentWithStudent.student.grade,
            major: parentWithStudent.student.major,
            classNumber: parentWithStudent.student.classNumber,
          },
          studentSubjects: parentWithStudent.student.studentSubjects,
          attendanceStats,
          problemPointRecords,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("API_ERROR", {
      route: "/api/parent",
      message: error instanceof Error ? error.message : String(error),
    });
    return handleError(error);
  }
}
