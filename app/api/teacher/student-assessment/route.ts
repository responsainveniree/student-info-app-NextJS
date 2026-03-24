import { badRequest, handleError } from "@/lib/errors";
import { validateTeacherSession } from "@/lib/validation/guards";
import {
  createStudentAssessmentSchema,
  getStudentAssessmentSchema,
  updateStudentAssessmentSchema,
} from "@/lib/zod/assessment";
import {
  createStudentAssessment,
  deleteStudentAssessment,
  getStudentAssessment,
  updateStudentAssessment,
} from "@/services/assessment/student-assessment-service";
import { printConsoleError } from "@/lib/utils/printError";

export async function POST(req: Request) {
  try {
    const teacherSession = await validateTeacherSession();

    const rawData = await req.json();
    const data = createStudentAssessmentSchema.parse(rawData);

    const response = await createStudentAssessment(data, teacherSession);

    return Response.json(
      {
        message: `Successfully created new assignment column for subject ${data.subjectName} in ${response.classLabel}`,
      },
      { status: 201 },
    );
  } catch (error) {
    printConsoleError(error, "POST", "/api/teacher/student-assessment");
    return handleError(error);
  }
}

export async function GET(req: Request) {
  try {
    const teacherSession = await validateTeacherSession();

    const { searchParams } = new URL(req.url);

    const rawData = Object.fromEntries(searchParams.entries());
    const data = getStudentAssessmentSchema.parse(rawData);

    const response = await getStudentAssessment(data, teacherSession);

    return Response.json(
      {
        message: "Students' assessment data retrieved successfully",
        assessments: response.assessments,
      },
      { status: 200 },
    );
  } catch (error) {
    printConsoleError(error, "GET", "/api/teacher/student-assessment");
    return handleError(error);
  }
}

export async function PATCH(req: Request) {
  try {
    await validateTeacherSession();

    const rawData = await req.json();
    const data = updateStudentAssessmentSchema.parse(rawData);

    await updateStudentAssessment(data);

    return Response.json(
      {
        message: "Assessment data updated successfully",
      },
      { status: 200 },
    );
  } catch (error) {
    printConsoleError(error, "PATCH", "/api/teacher/student-assessment");
    return handleError(error);
  }
}

export async function DELETE(req: Request) {
  try {
    await validateTeacherSession();

    const { searchParams } = new URL(req.url);

    const assessmentIdParam = Number(searchParams.get("assessmentId"));
    const teachingAssignmentIdParam = Number(
      searchParams.get("teachingAssignmentId"),
    );

    if (!assessmentIdParam || !teachingAssignmentIdParam) {
      throw badRequest("Assessment id or teaching assignment id is missing");
    }

    await deleteStudentAssessment(assessmentIdParam, teachingAssignmentIdParam);

    return Response.json(
      {
        message: "Assessment data deleted successfully",
      },
      { status: 200 },
    );
  } catch (error) {
    printConsoleError(error, "DELETE", "/api/teacher/student-assessment");
    return handleError(error);
  }
}
