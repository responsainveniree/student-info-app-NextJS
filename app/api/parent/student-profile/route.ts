import { handleError } from "@/lib/errors";
import { validateParentSession } from "@/domain/auth/role-guards";
import { printConsoleError } from "@/lib/utils/printError";
import { getStudentProfile } from "@/services/parent/parent-service";

export async function GET() {
  try {
    const parentSession = await validateParentSession();

    const response = await getStudentProfile(parentSession);

    return Response.json(
      {
        mesasge: "Successfully retrieved student attendance stats for parents",
        data: {
          studentName: parentSession.student.user.name,
          student: {
            id: parentSession.studentId,
            grade: parentSession.student.class?.grade,
            major: parentSession.student.class?.major,
            section: parentSession.student.class?.section,
          },
          studentSubjects: response.totalSubjects,
          attendanceStats: response.attendanceRecords,
          demeritPointRecords: response.demeritPointRecords,
        },
      },
      { status: 200 },
    );
  } catch (error) {
    printConsoleError(error, "GET", "/api/parent/student-profile");
    return handleError(error);
  }
}
