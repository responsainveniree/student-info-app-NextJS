import { handleError, notFound } from "@/lib/errors";
import { getStudentExportSchema } from "@/lib/utils/zodSchema";
import { prisma } from "@/db/prisma";
import * as XLSX from "xlsx";
import { validateManagementSession } from "@/lib/validation/guards";

export async function GET(req: Request) {
  try {
    validateManagementSession();

    const { searchParams } = new URL(req.url);

    const rawData = Object.fromEntries(searchParams.entries());

    const data = getStudentExportSchema.parse(rawData);

    const studentRecords = await prisma.classroom.findUnique({
      where: {
        grade_major_section: {
          grade: data.grade,
          major: data.major,
          section: data.section,
        },
      },
      select: {
        students: {
          select: {
            user: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    if (studentRecords?.students.length === 0) {
      throw notFound("Student not found");
    }

    const studentsWorksheet = XLSX.utils.json_to_sheet(
      studentRecords?.students.map((student: { user: { id: string; name: string; }; }) => student.user) as [],
    );
    const studentWorkbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(
      studentWorkbook,
      studentsWorksheet,
      "Student Data",
    );

    const studentBuffer = XLSX.write(studentWorkbook, {
      type: "buffer",
      bookType: "xlsx",
    });

    return new Response(studentBuffer, {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": "attachment; filename=Student-Data.xlsx",
      },
    });
  } catch (error) {
    console.error("API_ERROR", {
      route: "/api/staff/student",
      message: error instanceof Error ? error.message : String(error),
    });
    return handleError(error);
  }
}
