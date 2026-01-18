import {
  categoryLabelMap,
  SINGLE_PER_DAY_CATEGORIES,
  SinglePerDayCategories,
  ValidProblemPointType,
} from "@/lib/constants/problemPoint";
import { badRequest, handleError, notFound } from "@/lib/errors";
import { getSemester, getSemesterDateRange } from "@/lib/utils/date";
import {
  problemPoint,
  problemPointQuerySchema,
  updateProblemPoint,
} from "@/lib/utils/zodSchema";
import { prisma } from "@/prisma/prisma";

// The funcionality of "category is SinglePerDayCategories" is if the function return true, the category must be "LATE" or "INCOMPLETE_ATTRIBUTES"
function isSinglePerDayCategory(
  category: ValidProblemPointType,
): category is SinglePerDayCategories {
  return SINGLE_PER_DAY_CATEGORIES.includes(category as SinglePerDayCategories);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const data = problemPoint.parse(body);

    const existingTeacher = await prisma.teacher.findUnique({
      where: { id: data.teacherId },
      select: { id: true },
    });

    if (!existingTeacher) {
      throw notFound("User not found");
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const problemPointDate = new Date(data.date);

    const { start: semesterStart, end: semesterEnd } =
      getSemesterDateRange(today);

    if (problemPointDate < semesterStart || problemPointDate > semesterEnd) {
      const semesterNum = getSemester(today);
      throw badRequest(
        `Attendance date is outside the current semester (Semester ${semesterNum}). ` +
          `Allowed range: ${semesterStart.toISOString().split("T")[0]} to ${semesterEnd.toISOString().split("T")[0]}.`,
      );
    }

    // Just in case, If we can validate through frontend, we dont have to revalidate it again in backend
    const uniqueStudentIds = [...new Set(data.studentsId)];

    const existingStudent = await prisma.student.findMany({
      where: {
        id: {
          in: uniqueStudentIds,
        },
      },
      select: {
        id: true,
      },
    });

    await prisma.$transaction(async (tx) => {
      for (const student of existingStudent) {
        if (isSinglePerDayCategory(data.problemPointCategory)) {
          const existingProblemPoint = await tx.problemPoint.findFirst({
            where: {
              studentId: student.id,
              category: data.problemPointCategory,
              date: problemPointDate,
            },
          });

          if (existingProblemPoint) {
            throw badRequest(
              `This student already has "${categoryLabelMap[data.problemPointCategory]}" problem`,
            );
          }
        }

        await tx.problemPoint.create({
          data: {
            category: data.problemPointCategory,
            point: data.point,
            description: data.description.toString().trim() || "",
            recordedBy: data.teacherId,
            studentId: student.id,
            date: problemPointDate,
          },
        });
      }
    });

    return Response.json(
      {
        message: "Successfully created problem point record",
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("API_ERROR", {
      route: "/api/problem-point",
      message: error instanceof Error ? error.message : String(error),
    });
    return handleError(error);
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const rawParams = Object.fromEntries(searchParams.entries());

    const data = problemPointQuerySchema.parse(rawParams);

    if (!data.recordedBy) {
      throw badRequest("Teacher ID is required");
    }

    const assignedProblemPoint = await prisma.problemPoint.findMany({
      where: {
        recordedBy: data.recordedBy,
        student: {
          classNumber: data.classNumber,
          grade: data.grade,
          major: data.major,
        },
      },
      select: {
        id: true,
        point: true,
        category: true,
        date: true,
        description: true,
        student: {
          select: {
            name: true,
          },
        },
      },
    });

    return Response.json(
      {
        message: "Successfully retrieved assigned problem point records",
        data: assignedProblemPoint,
      },
      {
        status: 200,
      },
    );
  } catch (error) {
    console.error("API_ERROR", {
      route: "/api/problem-point",
      message: error instanceof Error ? error.message : String(error),
    });
    return handleError(error);
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const problemPointIdParam = Number(searchParams.get("problemPointId"));

    if (!problemPointIdParam) {
      throw badRequest("Problem point ID is missing");
    }

    await prisma.problemPoint.delete({
      where: {
        id: problemPointIdParam,
      },
    });

    return Response.json(
      {
        message: "Successfully deleted problem point record",
      },
      {
        status: 200,
      },
    );
  } catch (error) {
    console.error("API_ERROR", {
      route: "/api/problem-point",
      message: error instanceof Error ? error.message : String(error),
    });
    return handleError(error);
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const data = updateProblemPoint.parse(body);

    const existingTeacher = await prisma.teacher.findUnique({
      where: { id: data.teacherId },
      select: { id: true },
    });

    if (!existingTeacher) {
      throw notFound("Teacher not found");
    }

    const existingProblemPoint = await prisma.problemPoint.findUnique({
      where: {
        id: data.problemPointId,
      },
      select: {
        id: true,
      },
    });

    if (!existingProblemPoint) {
      throw notFound("Problem point record was not found");
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const problemPointDate = new Date(data.date);

    const { start: semesterStart, end: semesterEnd } =
      getSemesterDateRange(today);

    if (problemPointDate < semesterStart || problemPointDate > semesterEnd) {
      const semesterNum = getSemester(today);
      throw badRequest(
        `Attendance date is outside the current semester (Semester ${semesterNum}). ` +
          `Allowed range: ${semesterStart.toISOString().split("T")[0]} to ${semesterEnd.toISOString().split("T")[0]}.`,
      );
    }

    await prisma.problemPoint.update({
      where: {
        id: data.problemPointId,
      },
      data: {
        category: data.problemPointCategory,
        point: data.point,
        date: new Date(data.date),
        description: data.description,
      },
    });

    return Response.json(
      {
        message: "Successfully update problem point record",
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("API_ERROR", {
      route: "/api/problem-point",
      message: error instanceof Error ? error.message : String(error),
    });
    return handleError(error);
  }
}
