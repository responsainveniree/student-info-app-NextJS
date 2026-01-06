import { badRequest, handleError, notFound } from "@/lib/errors";
import { prisma } from "@/prisma/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const studentId = searchParams.get("studentId");

    if (!studentId) {
      throw badRequest("User id is missing");
    }

    const existingStudent = await prisma.student.findUnique({
      where: { id: studentId },
      select: {
        studentSubjects: true,
      },
    });

    if (!existingStudent) {
      throw notFound("Student not found");
    }

    return Response.json(
      {
        message: "Succesfully retrieved student list subjects data",
        data: existingStudent,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(`Error in list-subject: ${error}`);
    return handleError(error);
  }
}
