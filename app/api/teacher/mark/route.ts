import {
  badRequest,
  handleError,
  interalServerError,
  notFound,
} from "@/lib/errors";
import { getSemester } from "@/lib/utils/date";
import { markRecords } from "@/lib/utils/zodSchema";
import { prisma } from "@/prisma/prisma";
import * as XLSX from "xlsx";

type StudentMark = {
  studentId: string;
  subjectName: string;
  studentAssessments: string;
};

export async function PATCH(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const teacherId = formData.get("teacherId");

    if (file && teacherId) {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const data = XLSX.utils.sheet_to_json(worksheet) as StudentMark[];

      if (data.length === 0) {
        throw badRequest("Excel file is empty");
      }

      await prisma.$transaction(async (tx) => {
        for (let i = 0; i < data.length; i++) {
          const row = data[i];
          const rowNumber = i + 2; // +2 because Excel rows start at 1 and we have header

          if (!row.studentAssessments) {
            throw badRequest(`Row-${rowNumber}: Must be filled`);
          }
          console.log(row);
          const findStudent = await tx.student.findUnique({
            where: {
              id: row.studentId.trim(),
            },
            select: { id: true },
          });

          if (!findStudent) {
            throw notFound(`Row-${rowNumber}: user not found`);
          }

          const findSubjectMark = await tx.subjectMark.findUnique({
            where: {
              studentId_subjectName_academicYear_semester: {
                studentId: row.studentId,
                subjectName: row.subjectName,
                academicYear: String(new Date().getFullYear()),
                semester: getSemester(new Date()) === 1 ? "FIRST" : "SECOND",
              },
            },
          });

          if (!findSubjectMark) {
            throw interalServerError();
          }

          const studentAssignments = row.studentAssessments
            .split(",")
            .map((s) => s.trim());

          await Promise.all(
            studentAssignments.map(async (studentAssignment) => {
              const [assessmentNumber, score] = studentAssignment.split(":");

              if (!assessmentNumber || !score) {
                return badRequest(
                  `Row-${rowNumber}: use a standard format. "assignment number:score,asignment number:score,..."`
                );
              }

              if (!Number(assessmentNumber) || !Number(score)) {
                `Row-${rowNumber}: use a standard format. Use number for student assessments"`;
              }

              await tx.mark.update({
                where: {
                  subjectMarkId: findSubjectMark.id,
                  assessmentNumber: Number(assessmentNumber),
                },
                data: {
                  score: Number(score),
                },
              });
            })
          );
        }
      });

      return Response.json(
        { message: "Successfully updated students' marks " },
        { status: 201 }
      );
    } else {
      const body = await req.json();
      const data = markRecords.parse(body);

      await prisma.$transaction(async (tx) => {
        for (const student of data.students) {
          const subjectMark = await tx.subjectMark.findUnique({
            where: {
              studentId_subjectName_academicYear_semester: {
                studentId: student.studentId,
                subjectName: student.subjectName,
                academicYear: String(new Date().getFullYear()),
                semester: getSemester(new Date()) === 1 ? "FIRST" : "SECOND",
              },
            },
            select: {
              id: true,
            },
          });

          if (!subjectMark) {
            throw interalServerError();
          }

          for (const assessment of student.studentAssessments) {
            await tx.mark.update({
              where: {
                subjectMarkId: subjectMark.id,
                assessmentNumber: assessment.assessmentNumber,
              },
              data: {
                score: assessment.score,
              },
            });
          }
        }
      });

      return Response.json(
        { message: "Successfully updated students' marks" },
        { status: 201 }
      );
    }
  } catch (error) {
    console.error("API_ERROR", {
      route: "/api/teacher/mark",
      message: error instanceof Error ? error.message : String(error),
    });
    return handleError(error);
  }
}
