import { handleError } from "../../../../lib/errors";
import { validateHomeroomTeacherSession } from "../../../../lib/validation/guards";
import { attendanceSummaryQueries } from "@/lib/zod/attendance";
import { getAttendanceSumamry } from "@/services/attendance/attendance-service";

export async function GET(req: Request) {
  try {
    const homeroomTeacherSession = await validateHomeroomTeacherSession();

    const { searchParams } = new URL(req.url);

    const rawParams = Object.fromEntries(searchParams.entries());

    const data = attendanceSummaryQueries.parse(rawParams);

    const result = await getAttendanceSumamry(data, homeroomTeacherSession);

    return Response.json(
      {
        message: "Successfully retrieved students' attendance summary",
        class: {
          grade: homeroomTeacherSession.homeroom?.grade,
          major: homeroomTeacherSession.homeroom?.major,
          classNumber: homeroomTeacherSession.homeroom?.section,
        },
        students: result.studentAttendanceSummaries,
        totalStudents: result.totalStudents,
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
