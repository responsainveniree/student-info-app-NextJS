import { badRequest, handleError, notFound } from "@/lib/errors";
import { getDayBounds } from "@/lib/utils/date";
import { prisma } from "@/prisma/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const teacherIdParam = searchParams.get("teacherId");
    const dateParam = searchParams.get("date");
    if (!teacherIdParam) {
      throw badRequest("Teacher id is missing.");
    }

    if (dateParam) {
      const page = Number(searchParams.get("page")) || 0;

      if (!teacherIdParam || !dateParam) {
        throw badRequest("Missing required field");
      }
      const targetDate = new Date(dateParam);

      const { startOfDay, endOfDay } = getDayBounds(targetDate);

      const existingTeacher = await prisma.homeroomClass.findUnique({
        where: { teacherId: teacherIdParam },
        select: {
          classNumber: true,
          grade: true,
          major: true,
        },
      });

      if (!existingTeacher) {
        return notFound("Teacher not found");
      }

      const findStudents = await prisma.student.findMany({
        where: {
          classNumber: existingTeacher.classNumber,
          grade: existingTeacher.grade,
          major: existingTeacher.major,
        },
        select: {
          id: true,
          name: true,
          attendances: {
            where: {
              date: {
                gte: startOfDay,
                lte: endOfDay,
              },
            },
            select: {
              date: true,
              type: true,
              description: true,
            },
          },
        },
        skip: page * 10,
        take: 10,
      });

      const totalStudents = await prisma.student.count({
        where: {
          classNumber: existingTeacher.classNumber,
          grade: existingTeacher.grade,
          major: existingTeacher.major,
        },
      });

      // Get attendance stats for the selected date
      const attendanceStats = await prisma.studentAttendance.groupBy({
        by: ["type"],
        where: {
          date: {
            gte: startOfDay,
            lte: endOfDay,
          },
          student: {
            classNumber: existingTeacher.classNumber,
            grade: existingTeacher.grade,
            major: existingTeacher.major,
          },
        },
        _count: {
          type: true,
        },
      });

      // Transform stats into usable format
      const stats = {
        sick: 0,
        permission: 0,
        alpha: 0,
      };

      for (const stat of attendanceStats) {
        if (stat.type === "SICK") stats.sick = stat._count.type;
        else if (stat.type === "PERMISSION")
          stats.permission = stat._count.type;
        else if (stat.type === "ALPHA") stats.alpha = stat._count.type;
      }

      return Response.json(
        {
          message: "Succesfully retrieved homeroom class students data",
          data: {
            students: findStudents,
            totalStudents,
            stats,
          },
        },
        { status: 200 }
      );
    }

    const existingTeacher = await prisma.teacher.findUnique({
      where: { id: teacherIdParam },
      select: {
        teachingAssignments: {
          select: {
            grade: true,
            major: true,
            classNumber: true,
            subject: {
              select: {
                subjectName: true,
                id: true,
              },
            },
          },
        },
        teachingClasses: true,
      },
    });

    if (!existingTeacher) {
      throw notFound("Teacher not found.");
    }

    return Response.json(
      {
        message:
          "Successfully retrieved teacher's teaching classes and asignments data",
        data: {
          teachingClasses: existingTeacher.teachingClasses,
          teachingAssignments: existingTeacher.teachingAssignments,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("API_ERROR", {
      route: "/api/teacher",
      message: error instanceof Error ? error.message : String(error),
    });
    return handleError(error);
  }
}
