import { handleError } from "@/lib/errors";
import { validateTeacherSession } from "@/lib/validation/guards";
import {
  createDemeritPointSchema,
  updateDemeritPointSchema,
} from "@/lib/zod/demerit-point";
import {
  createDemeritPoint,
  deleteDemeritPoint,
  getDemeritPoint,
  updateDemeritPoint,
} from "@/services/demerit-point/demerit-point-service";
import { printConsoleError } from "@/lib/utils/printError";

export async function POST(req: Request) {
  try {
    const teacherSession = await validateTeacherSession();

    const rawData = await req.json();
    const data = createDemeritPointSchema.parse(rawData);

    await createDemeritPoint(data, teacherSession);

    return Response.json(
      {
        message: "Successfully created demerit point record",
      },
      { status: 201 },
    );
  } catch (error) {
    printConsoleError(error, "POST", "/api/demerit-point");
    return handleError(error);
  }
}

export async function GET(req: Request) {
  try {
    const teacherSession = await validateTeacherSession();

    const { searchParams } = new URL(req.url);

    const page = Number(searchParams.get("page"));

    const result = await getDemeritPoint(teacherSession, page);

    return Response.json(
      {
        message: "Successfully retrieved assigned demerit point records",
        data: result.assignedDemeritPoints,
        totalRecords: result.totalRecords,
      },
      {
        status: 200,
      },
    );
  } catch (error) {
    printConsoleError(error, "GET", "/api/demerit-point");
    return handleError(error);
  }
}

export async function DELETE(req: Request) {
  try {
    await validateTeacherSession();

    const { searchParams } = new URL(req.url);

    const demeritRecordIdParam = Number(searchParams.get("demeritRecordId"));

    await deleteDemeritPoint(demeritRecordIdParam);

    return Response.json(
      {
        message: "Successfully deleted demerit point record",
      },
      {
        status: 200,
      },
    );
  } catch (error) {
    printConsoleError(error, "DELETE", "/api/demerit-point");
    return handleError(error);
  }
}

export async function PATCH(req: Request) {
  try {
    await validateTeacherSession();
    const body = await req.json();
    const data = updateDemeritPointSchema.parse(body);

    await updateDemeritPoint(data);

    return Response.json(
      {
        message: "Successfully updated demerit point record",
      },
      { status: 200 },
    );
  } catch (error) {
    printConsoleError(error, "PATCH", "/api/demerit-point");
    return handleError(error);
  }
}
