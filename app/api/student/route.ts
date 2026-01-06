import { ClassNumber, Grade, Major } from "@/lib/constants/class";
import { badRequest, forbidden, handleError, notFound } from "@/lib/errors";
import { prisma } from "@/prisma/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const grade = searchParams.get("grade") as Grade;
    const page = Number(searchParams.get("page")) || 0;
    const takeRecords = 10;

    const major = searchParams.get("major") as Major;
    const classNumber = searchParams.get("classNumber") as ClassNumber;

    if (!grade || !major || !classNumber) {
      throw badRequest("There are missing parameters");
    }

    const findStudents = await prisma.student.findMany({
      // I don't know do I have to index those fields
      where: {
        grade: grade,
        major: major,
        classNumber: classNumber,
      },
      select: {
        id: true,
        name: true,
      },
      skip: page * 10,
      take: takeRecords,
    });

    const totalStudents = await prisma.student.count({
      where: {
        grade: grade,
        major: major,
        classNumber: classNumber,
      },
    });

    return Response.json(
      {
        message: "Successfully retrieved list of students by class",
        students: findStudents,
        totalStudents,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(`Error in list-students-by-class: ${error}`);
    return handleError(error);
  }
}
