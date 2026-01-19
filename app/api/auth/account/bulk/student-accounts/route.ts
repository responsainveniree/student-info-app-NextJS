import { badRequest, handleError, notFound } from "@/lib/errors";
import { prisma } from "@/prisma/prisma";
import hashing from "@/lib/utils/hashing";
import { subjects } from "@/lib/utils/subjects";
import * as XLSX from "xlsx";
import { Grade, GRADES, Major, MAJORS } from "@/lib/constants/class";
import crypto from "crypto";
import { getSemester } from "@/lib/utils/date";
interface StudentRow {
  username: string;
  email: string;
  password: string;
  grade: Grade;
  major: Major;
  classNumber?: string;
}

type ParentAccount = {
  email: string;
  password: string;
};

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      throw badRequest("No file uploaded");
    }

    // Read Excel file
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer);
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(worksheet) as StudentRow[];

    if (data.length === 0) {
      throw badRequest("Excel file is empty");
    }

    const parentAccounts: ParentAccount[] = [];

    // Process each student
    await prisma.$transaction(
      async (tx) => {
        for (let i = 0; i < data.length; i++) {
          const row = data[i];
          const rowNumber = i + 2; // +2 because Excel rows start at 1 and we have header

          // Validate required fields
          if (
            !row.username ||
            !row.email ||
            !row.password ||
            !row.grade ||
            !row.major
          ) {
            throw badRequest(`Row ${rowNumber}: Missing required fields`);
          }

          //Validate grade and major type
          if (!GRADES.includes(row.grade as Grade)) {
            throw badRequest(`Row ${rowNumber}: Invalid grade format`);
          }

          if (!MAJORS.includes(row.major as Major)) {
            throw badRequest(`Row ${rowNumber}: Invalid major format`);
          }

          // Check if student already exists
          const existingStudent = await tx.student.findUnique({
            where: { email: row.email },
          });

          if (existingStudent) {
            throw badRequest(`Row ${rowNumber}: Email already registered`);
          }

          // Hash password
          const hashedPassword = await hashing(row.password);

          // Find homeroom class
          const homeroomClass = await tx.homeroomClass.findFirst({
            where: {
              grade: row.grade,
              major: row.major,
              classNumber: row.classNumber,
            },
            select: {
              teacherId: true,
            },
          });

          if (!homeroomClass) {
            throw badRequest(`Row ${rowNumber}: Homeroom class not found`);
          }

          // Create student
          const student = await tx.student.create({
            data: {
              name: row.username,
              email: row.email,
              password: hashedPassword,
              grade: row.grade,
              major: row.major,
              classNumber: row.classNumber as string,
              isVerified: true,
              homeroomTeacherId: homeroomClass.teacherId,
            },
            select: {
              id: true,
              name: true,
            },
          });

          // Get subject list
          const subjectsList = subjects[row.grade]?.major?.[row.major] ?? [];

          if (subjectsList.length === 0) {
            throw badRequest(
              `Row ${rowNumber}: Subject configuration not found`,
            );
          }

          // Upsert subjects
          const subjectRecords = await Promise.all(
            subjectsList.map(async (subjectName) => {
              return await tx.subject.upsert({
                where: { subjectName },
                update: {},
                create: { subjectName },
              });
            }),
          );

          // Connect subjects to student
          await tx.student.update({
            where: { id: student.id },
            data: {
              studentSubjects: {
                connect: subjectRecords.map((s) => ({ id: s.id })),
              },
            },
          });

          //Upsert all subjectmMark
          const today = new Date();
          const currentSemester = getSemester(today);

          const subjectMarkRecords = await Promise.all(
            subjectsList.map(async (subjectName) => {
              const subjectMark = await tx.subjectMark.upsert({
                where: {
                  studentId_subjectName_academicYear_semester: {
                    studentId: student.id,
                    subjectName: subjectName,
                    academicYear: String(new Date().getFullYear()),
                    semester: currentSemester === 1 ? "FIRST" : "SECOND",
                  },
                },
                update: {},
                create: {
                  studentId: student.id,
                  subjectName: subjectName,
                  academicYear: String(new Date().getFullYear()),
                  semester: currentSemester === 1 ? "FIRST" : "SECOND",
                },
              });
              return subjectMark;
            }),
          );

          // Connect subjectMark to student
          await tx.student.update({
            where: { id: student.id },
            data: {
              subjectMarks: {
                connect: subjectMarkRecords.map((subjectMark) => ({
                  id: subjectMark.id,
                })),
              },
            },
            include: {
              subjectMarks: true,
            },
          });

          const rawRandomPassword = crypto.randomBytes(8).toString("hex");
          const hashRandomPassword = await hashing(rawRandomPassword);

          await tx.parent.upsert({
            where: {
              studentId: student.id,
            },
            update: {},
            create: {
              email: `${student.name.toLowerCase().replaceAll(" ", "")}parentaccount@gmail.com`,
              name: `${student.name}'s Parents`,
              password: hashRandomPassword,
              role: "PARENT",
              studentId: student.id,
            },
          });

          parentAccounts.push({
            email: `${student.name.toLowerCase().replaceAll(" ", "")}parentaccount@gmail.com`,
            password: rawRandomPassword,
          });
        }
      },
      {
        timeout: 10000,
      },
    );

    const parentWorksheet = XLSX.utils.json_to_sheet(parentAccounts);
    const parentWorkbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(
      parentWorkbook,
      parentWorksheet,
      "Parent Accounts",
    );

    const parentbuffer = XLSX.write(parentWorkbook, {
      type: "buffer",
      bookType: "xlsx",
    });

    return new Response(parentbuffer, {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": "attachment; filename=parent-accounts.xlsx",
      },
    });
  } catch (error) {
    console.error("API_ERROR", {
      route: "/api/auth/account/bulk/student-accounts",
      message: error instanceof Error ? error.message : String(error),
    });
    return handleError(error);
  }
}
