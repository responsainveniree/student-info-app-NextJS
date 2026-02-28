import { handleError } from "@/lib/errors";
import { prisma } from "@/db/prisma";
import { studentQuerySchema } from "@/lib/utils/zodSchema";
import {
  MIN_SEARCH_LENGTH,
  OFFSET,
  TAKE_RECORDS,
} from "@/lib/constants/pagination";
import { validateLoginSession } from "@/lib/validation/guards";

type Student = {
  user: {
    id: string;
    name: string;
  };
};

export async function GET(req: Request) {
  try {
    await validateLoginSession();

    const { searchParams } = new URL(req.url);

    const rawData = Object.fromEntries(searchParams.entries());

    const data = studentQuerySchema.parse(rawData);

    let students: Student[], totalStudents: number;

    if (data.search?.length && data.search.length >= MIN_SEARCH_LENGTH) {
      students = await prisma.student.findMany({
        where: {
          user: {
            name: {
              mode: "insensitive",
              contains: data.search,
            },
          },
        },
        select: {
          user: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      totalStudents = await prisma.student.count({
        where: {
          user: {
            name: {
              contains: data.search,
            },
          },
        },
      });
    } else {
      students = await prisma.student.findMany({
        where: {
          class: {
            grade: data.grade,
            major: data.major,
            section: data.section,
          },
        },
        select: {
          user: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        skip: data.page * OFFSET,
        take: TAKE_RECORDS,
      });

      totalStudents = await prisma.student.count({
        where: {
          class: {
            grade: data.grade,
            major: data.major,
            section: data.section,
          },
        },
      });
    }

    return Response.json(
      {
        message: "Successfully retrieved list of students",
        data: { students },
        totalStudents,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("API_ERROR", {
      route: "/api/student",
      message: error instanceof Error ? error.message : String(error),
    });
    return handleError(error);
  }
}
