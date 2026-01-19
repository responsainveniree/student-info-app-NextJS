import { isStudentRole } from "@/lib/constants/roles";
import { badRequest, handleError, notFound, forbidden } from "@/lib/errors";
import { OFFSET, TAKE_RECORDS } from "@/lib/constants/pagination";
import { queryStudentMarks } from "@/lib/utils/zodSchema";
import { prisma } from "@/prisma/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const rawParams = Object.fromEntries(searchParams.entries());

    const data = queryStudentMarks.parse(rawParams);

    if (!data.studentId) {
      throw badRequest("Missing studentId parameter.");
    }

    const existingStudent = await prisma.student.findUnique({
      where: { id: data.studentId },
      select: { role: true, id: true },
    });

    if (!existingStudent) {
      throw notFound("User not found");
    }

    if (!isStudentRole(existingStudent.role)) {
      throw forbidden("You can't access this resource");
    }

    let studentMarkRecords, totalMarks;

    if (data.studentId && data.subjectName && data.isMarkPage) {
      studentMarkRecords = await prisma.student.findUnique({
        where: {
          id: data.studentId,
        },
        select: {
          id: true,
          name: true,
          subjectMarks: {
            where: {
              subjectName: data.subjectName,
            },
            select: {
              id: true,
              marks: {
                select: {
                  id: true,
                  assessmentNumber: true,
                  score: true,
                  type: true,
                  description: {
                    select: {
                      detail: true,
                      dueAt: true,
                      givenAt: true,
                    },
                  },
                },
                skip: data.page * OFFSET,
                take: TAKE_RECORDS,
              },
            },
          },
        },
      });
      totalMarks = await prisma.mark.count({
        where: {
          subjectMarkId: studentMarkRecords?.subjectMarks[0].id,
        },
      });
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

    const subjects = await prisma.student.findUnique({
      where: { id: data.studentId },
      select: {
        studentSubjects: true,
      },
    });

    return Response.json(
      {
        mesasge: "Successfully retrieved student attendance stats",
        data: {
          attendanceRecords,
          problemPointRecords,
          subjects,
          marks: {
            studentMarkRecords,
            totalMarks,
          },
        },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("API_ERROR", {
      route: "/api/student/profile",
      message: error instanceof Error ? error.message : String(error),
    });
    return handleError(error);
  }
}
