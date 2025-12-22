import { badRequest, handleError, notFound } from "@/lib/errors";
import { prisma } from "@/prisma/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const homeroomTeacherId = searchParams.get("homeroomTeacherId");

    if (!homeroomTeacherId) {
      throw badRequest("Homeroom teacher id is missing");
    }

    const existingTeacher = await prisma.teacher.findUnique({
      where: { id: homeroomTeacherId },
      select: {
        students: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!existingTeacher) {
      throw notFound("Homeroom teacher not found");
    }

    if (existingTeacher.students.length === 0) {
      return Response.json(
        { message: "No students assigned to this teacher", data: [] },
        { status: 200 }
      );
    }

    return Response.json(
      {
        message: "Successfully retrieved student data",
        data: existingTeacher.students,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(`Error: ${error}`);
    return handleError(error);
  }
}
