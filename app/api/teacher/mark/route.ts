import {
  badRequest,
  handleError,
  interalServerError,
  notFound,
} from "@/lib/errors";
import { getSemester } from "@/lib/utils/date";
import { markRecords } from "@/lib/utils/zodSchema";
import { prisma } from "@/prisma/prisma";

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const data = markRecords.parse(body);

    await prisma.$transaction(async (tx) => {
      for (const student of data.students) {
        const subjectMark = await tx.subjectMark.findUnique({
          where: {
            studentId_subjectName_academicYear_semester: {
              studentId: student.studentId,
              subjectName: student.subjectName,
              academicYear: String(new Date().getFullYear()),
              semester: getSemester(new Date()) === 1 ? "FIRST" : "SECOND",
            },
          },
          select: {
            id: true,
          },
        });

        if (!subjectMark) {
          throw interalServerError();
        }

        for (const assessment of student.studentAssessments) {
          await tx.mark.update({
            where: {
              subjectMarkId_assessmentNumber: {
                subjectMarkId: subjectMark.id,
                assessmentNumber: assessment.assessmentNumber,
              },
            },
            data: {
              score: assessment.score,
            },
          });
        }
      }
    });

    return Response.json(
      { message: "Successfully updated students' marks" },
      { status: 201 }
    );
  } catch (error) {
    console.error("API_ERROR", {
      route: "/api/teacher/mark",
      message: error instanceof Error ? error.message : String(error),
    });
    return handleError(error);
  }
}
