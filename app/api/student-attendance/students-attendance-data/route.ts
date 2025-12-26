import { badRequest, forbidden, handleError, notFound } from "@/lib/errors";

import { prisma } from "@/prisma/prisma";

/**
 * Gets the start and end of a specific day for date range queries.
 */
function getDayBounds(date: Date): { startOfDay: Date; endOfDay: Date } {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  return { startOfDay, endOfDay };
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const dateParam = searchParams.get("date");
    const homeroomTeacherId = searchParams.get("homeroomTeacherId");
    const studentId = searchParams.get("studentId");

    if (!dateParam || !homeroomTeacherId) {
      throw badRequest(
        "Missing required parameters: date and homeroomTeacherId."
      );
    }

    // Validate studentId if provided (for secretary verification)
    if (studentId) {
      const secretary = await prisma.student.findUnique({
        where: { id: studentId },
        select: { role: true, homeroomTeacherId: true },
      });

      if (!secretary) {
        throw notFound("Student not found.");
      }

      if (secretary.role !== "classSecretary") {
        throw forbidden("Only class secretaries can view attendance records.");
      }

      if (secretary.homeroomTeacherId !== homeroomTeacherId) {
        throw forbidden("You can only view attendance for your own class.");
      }
    }

    const targetDate = new Date(dateParam);
    const { startOfDay, endOfDay } = getDayBounds(targetDate);

    const teacher = await prisma.teacher.findUnique({
      where: { id: homeroomTeacherId },
      include: { students: { select: { id: true } } },
    });

    if (!teacher) {
      throw notFound("Teacher not found.");
    }

    const studentIds = teacher.students.map((s) => s.id);

    const records = await prisma.studentAttendance.findMany({
      where: {
        studentId: { in: studentIds },
        date: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
    });

    return Response.json(
      {
        message: "Attendance retrieved successfully.",
        data: records,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(error);
    return handleError(error);
  }
}
