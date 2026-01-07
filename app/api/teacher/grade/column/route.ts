import { handleError } from "@/lib/errors";
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

    const { searchParams } = new URL(req.url);
    const page = Number(searchParams.get("page")) || 0;
    const takeRecords = 10;

    await prisma.$transaction(async (tx) => {
      const studentRecords = await tx.student.findMany({
        where: {
          grade: data.class.grade,
          major: data.class.major,
          classNumber: data.class.classNumber,
        },
        select: {
          subjectMarks: {
            where: {
              subjectName: data.subjectName,
            },
            select: {
              id: true,
            },
          },
        },
        skip: page * 10,
        take: takeRecords,
      });

      const description = await tx.markDescription.create({
        data: {
          givenAt: data.description.givenAt,
          dueAt: data.description.dueAt,
          detail: data.description.detail,
        },
        select: {
          id: true,
        },
      });

      for (const student of studentRecords) {
        // A single mark that will be connected with subjectMark
        const mark = await tx.mark.create({
          data: {
            type: data.assessmentType,
            descriptionId: description.id,
            subjectMarkId: student.subjectMarks[0].id,
          },
          select: {
            id: true,
          },
        });

        await tx.subjectMark.update({
          where: {
            id: student.subjectMarks[0].id,
          },
          data: {
            marks: {
              connect: { id: mark.id },
            },
          },
        });
      }
    });

    const gradeLabel = getGradeNumber(data.class.grade);
    const majorLabel = getMajorDisplayName(data.class.major);
    const classNumber = formatClassNumber(data.class.classNumber);
    const subjectLabel = SUBJECT_DISPLAY_MAP[data.subjectName];

    return Response.json(
      {
        message: `Successfully created new column for subject ${subjectLabel} in ${gradeLabel} ${majorLabel} ${classNumber}`,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("API_ERROR", {
      route: "/api/teacher/grade/column",
      message: error instanceof Error ? error.message : String(error),
    });
    return handleError(error);
  }
}
