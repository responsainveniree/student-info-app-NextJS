import { forbidden, handleError, notFound } from "@/lib/errors";
import {
  MIN_SEARCH_LENGTH,
  OFFSET,
  TAKE_RECORDS,
} from "@/lib/utils/pagination";
import { attendanceSummaryQueries } from "@/lib/utils/zodSchema";
import { prisma } from "@/prisma/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const rawParams = Object.fromEntries(searchParams.entries());

    const data = attendanceSummaryQueries.parse(rawParams);

    const teacher = await prisma.teacher.findUnique({
      where: { id: data.id },
      select: {
        id: true,
        role: true,
        homeroomClass: true,
      },
    });

    if (!teacher) {
      throw notFound("User not found");
    }

    if (teacher.role !== "TEACHER") {
      throw forbidden("You're not allowed to access this resources");
    }

    if (!teacher.homeroomClass) {
      throw forbidden("You're not allowed to access this resources");
    }

    let students;

    if (data.searchQuery && data.searchQuery?.length > MIN_SEARCH_LENGTH) {
      students = await prisma.student.findMany({
        where: {
          homeroomTeacherId: data.id,
          name: {
            contains: data.searchQuery,
            mode: "insensitive",
          },
        },
        select: {
          name: true,
          id: true,
          attendances: {
            select: {
              type: true,
            },
          },
        },
        skip: data.page * OFFSET,
        take: TAKE_RECORDS,
      });
    } else {
      students = await prisma.student.findMany({
        where: {
          homeroomTeacherId: data.id,
        },
        select: {
          name: true,
          id: true,
          attendances: {
            select: {
              type: true,
            },
          },
        },
        skip: data.page * OFFSET,
        take: TAKE_RECORDS,
        orderBy: {
          name: data.sortOrder === "asc" ? "asc" : "desc",
        },
      });
    }

    const studentAttendanceSummaries = await Promise.all(
      students.map(async (student) => {
        const data = await prisma.studentAttendance.groupBy({
          by: ["type"],
          where: {
            studentId: student.id,
          },
          _count: true,
        });

        return {
          name: student.name,
          attendanceSummary: data,
        };
      }),
    );

    return Response.json(
      {
        message: "Successfully retrieved students' attendance summary",
        students: studentAttendanceSummaries,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("API_ERROR", {
      route: "/api/student/attendance/summary",
      message: error instanceof Error ? error.message : String(error),
    });
    return handleError(error);
  }
}
