import { handleError } from "@/lib/errors";
import { getSemester } from "@/lib/utils/date";
import {
  formatClassNumber,
  getGradeNumber,
  getMajorDisplayName,
  SUBJECT_DISPLAY_MAP,
} from "@/lib/utils/labels";
import { markColumn } from "@/lib/utils/zodSchema";
import { prisma } from "@/prisma/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const data = markColumn.parse(body);

    await prisma.$transaction(async (tx) => {
      const studentRecords = await tx.student.findMany({
        where: {
          grade: data.class.grade,
          major: data.class.major,
          classNumber: data.class.classNumber,
        },
        select: {
          id: true,
        },
      });

      const parseGivenAt = new Date(data.description.givenAt);
      const parseDueAt = new Date(data.description.dueAt);

      const description = await tx.markDescription.create({
        data: {
          givenAt: parseGivenAt,
          dueAt: parseDueAt,
          detail: data.description.detail,
        },
        select: {
          id: true,
        },
      });

      for (const student of studentRecords) {
        console.log(student);
        const subjectMark = await tx.subjectMark.findUnique({
          where: {
            studentId_subjectName_academicYear_semester: {
              studentId: student.id,
              subjectName: data.subjectName,
              academicYear: String(new Date().getFullYear()),
              semester: getSemester(new Date()) === 1 ? "FIRST" : "SECOND",
            },
          },
          select: {
            id: true,
            _count: true,
          },
        });

        console.log("test", subjectMark);

        // A single mark that will be connected with subjectMark
        await tx.mark.create({
          data: {
            type: data.assessmentType,
            descriptionId: description.id,
            subjectMarkId: subjectMark?.id as number,
            assessmentNumber:
              subjectMark?._count.marks === undefined
                ? 0
                : subjectMark?._count.marks + 1,
          },
        });
      }

      await tx.teachingAssignment.update({
        where: {
          teacherId_subjectId_grade_major_classNumber: {
            grade: data.class.grade,
            major: data.class.major,
            classNumber: data.class.classNumber,
            teacherId: data.teacherId,
            subjectId: data.subjectId,
          },
        },
        data: {
          totalAssignmentsAssigned: {
            increment: 1,
          },
        },
      });
    });

    const gradeLabel = getGradeNumber(data.class.grade);
    const majorLabel = getMajorDisplayName(data.class.major);
    const classNumber = formatClassNumber(data.class.classNumber);
    const subjectLabel = SUBJECT_DISPLAY_MAP[data.subjectName];

    return Response.json(
      {
        message: `Successfully created new assignment column for subject ${subjectLabel} in ${gradeLabel} ${majorLabel} ${classNumber}`,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("API_ERROR", {
      route: "/api/teacher/mark/column",
      message: error instanceof Error ? error.message : String(error),
    });
    return handleError(error);
  }
}

export async function DELETE(req: Request) {}
