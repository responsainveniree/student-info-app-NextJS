import { badRequest, handleError, notFound } from "@/lib/errors";
import { prisma } from "@/prisma/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const studentIdParam = searchParams.get("studentId");

    if (!studentIdParam) {
      throw badRequest("Missing studentId parameter.");
    }

    const existingStudent = await prisma.student.findUnique({
      where: { id: studentIdParam },
    });

    if (!existingStudent) {
      throw notFound("User not found");
    }

    const attendanceRecords = await prisma.studentAttendance.findMany({
      where: { studentId: existingStudent.id },
      select: {
        date: true,
        type: true,
      },
    });

    const problemPointRecords = await prisma.problemPoint.findMany({
      where: { studentId: existingStudent.id },
      select: {
        description: true,
        category: true,
        point: true,
        date: true,
      },
    });

    return Response.json(
      {
        mesasge: "Successfully retrieved student attendance stats",
        data: { attendanceRecords, problemPointRecords },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(`Error in student attendance data: ${error}`);
    return handleError(error);
  }
}
