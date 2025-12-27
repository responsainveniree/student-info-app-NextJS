import { badRequest, handleError, notFound } from "@/lib/errors";
import { prisma } from "@/prisma/prisma";
import hashing from "@/lib/utils/hashing";
import { subjects } from "@/lib/utils/subjects";
import * as XLSX from "xlsx";
import { Grade, Major } from "@/lib/constants/class";
interface StudentRow {
  username: string;
  email: string;
  password: string;
  grade: Grade;
  major: Major;
  classNumber?: string;
}

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

    const results = {
      success: 0,
      failed: 0,
      errors: [] as Array<{ row: number; email: string; error: string }>,
    };

    // Process each student
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const rowNumber = i + 2; // +2 because Excel rows start at 1 and we have header

      try {
        // Validate required fields
        if (
          !row.username ||
          !row.email ||
          !row.password ||
          !row.grade ||
          !row.major
        ) {
          throw new Error("Missing required fields");
        }

        await prisma.$transaction(async (tx) => {
          // Check if student already exists
          const existingStudent = await tx.student.findUnique({
            where: { email: row.email },
          });

          if (existingStudent) {
            throw new Error("Email already registered");
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
            throw new Error("Homeroom class not found");
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
            },
          });

          // Get subject list
          const subjectsList = subjects[row.grade]?.major?.[row.major] ?? [];

          if (subjectsList.length === 0) {
            throw new Error("Subject configuration not found");
          }

          // Upsert subjects
          const subjectRecords = await Promise.all(
            subjectsList.map(async (subjectName) => {
              return await tx.subject.upsert({
                where: { subjectName },
                update: {},
                create: { subjectName },
              });
            })
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
        });

        results.success++;
      } catch (error: any) {
        results.failed++;
        results.errors.push({
          row: rowNumber,
          email: row.email || "N/A",
          error: error.message || "Unknown error",
        });
      }
    }

    return Response.json(
      {
        message: `Bulk import completed. Success: ${results.success}, Failed: ${results.failed}`,
        results,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("❌ Error bulk creating students:", error);
    return handleError(error);
  }
}
