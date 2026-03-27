import { handleError } from "@/lib/errors";
import { validateStudentSession } from "@/domain/auth/role-guards";
import { getStudentProfile } from "@/services/student/student-service";
import { printConsoleError } from "@/lib/utils/printError";

export async function GET() {
  try {
    const studentSession = await validateStudentSession();

    const response = await getStudentProfile(studentSession);

    return Response.json(
      {
        mesasge: "Successfully retrieved student attendance stats",
        data: {
          attendanceRecords: response.attendanceRecords,
          demeritPointRecords: response.demeritPointRecords,
          totalSubject: response.totalSubjects,
        },
      },
      { status: 200 },
    );
  } catch (error) {
    printConsoleError(error, "GET", "/api/student/profile");
    return handleError(error);
  }
}
