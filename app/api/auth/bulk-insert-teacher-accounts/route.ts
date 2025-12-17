// app/api/auth/bulk-create-teachers/route.ts
import { badRequest, handleError } from "@/lib/errors";
import { prisma } from "@/prisma/prisma";
import hashing from "@/lib/utils/hashing";
import { subjects as subjectsData } from "@/lib/utils/subjects";
import * as XLSX from "xlsx";

interface TeacherRow {
  username: string;
  email: string;
  password: string;
  homeroomGrade?: string;
  homeroomMajor?: string;
  homeroomClassNumber: string;
  teachingSubjects?: string; // Comma-separated: "math:tenth:accounting:1,english:eleventh:softwareEngineering:2"
  teachingClasses?: string; // Comma-separated: "tenth:accounting:1,eleventh:softwareEngineering:2"
}

type Grade = keyof typeof subjectsData;

type Major = keyof (typeof subjectsData)[Grade]["major"];

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
    const data = XLSX.utils.sheet_to_json(worksheet) as TeacherRow[];

    if (data.length === 0) {
      throw badRequest("Excel file is empty");
    }

    const results = {
      success: 0,
      failed: 0,
      errors: [] as Array<{ row: number; email: string; error: string }>,
    };

    // Process each teacher
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const rowNumber = i + 2;

      try {
        // Validate required fields
        if (!row.username || !row.email || !row.password) {
          throw new Error("Missing required fields");
        }

        await prisma.$transaction(async (tx) => {
          // Check if teacher already exists
          const existingTeacher = await tx.teacher.findUnique({
            where: { email: row.email },
          });

          if (existingTeacher) {
            throw new Error("Email already registered");
          }

          // Hash password
          const hashedPassword = await hashing(row.password);

          // Create teacher
          const teacher = await tx.teacher.create({
            data: {
              role: "teacher",
              name: row.username,
              email: row.email,
              password: hashedPassword,
            },
            select: {
              id: true,
            },
          });

          // Handle Homeroom Class
          if (row.homeroomGrade && row.homeroomMajor) {
            const existingHomeroomClass = await tx.homeroomClass.findFirst({
              where: {
                grade: row.homeroomGrade as any,
                major: row.homeroomMajor as any,
                classNumber: row.homeroomClassNumber,
              },
            });

            if (existingHomeroomClass) {
              throw new Error("Homeroom class already has a teacher");
            }

            await tx.homeroomClass.create({
              data: {
                grade: row.homeroomGrade as any,
                major: row.homeroomMajor as any,
                classNumber: row.homeroomClassNumber as string,
                teacherId: teacher.id,
              },
            });
          }

          // Handle Teaching Classes
          if (row.teachingClasses && row.teachingSubjects) {
            const classesArray = row.teachingClasses
              .split(",")
              .map((c) => c.trim());
            const teachingClasses = await Promise.all(
              classesArray.map(async (classStr) => {
                const [grade, major, classNumber] = classStr.split(":");
                return await tx.teachingClass.upsert({
                  where: {
                    grade_major_classNumber: {
                      grade: grade as Grade,
                      major: major as Major,
                      classNumber: classNumber,
                    },
                  },
                  update: {},
                  create: {
                    grade: grade as Grade,
                    major: major as Major,
                    classNumber: classNumber,
                  },
                });
              })
            );

            await tx.teacher.update({
              where: { id: teacher.id },
              data: {
                teachingClasses: {
                  connect: teachingClasses.map((tc) => ({ id: tc.id })),
                },
              },
            });
          }

          // Handle Teaching Assignments
          if (row.teachingSubjects && row.teachingClasses) {
            const subjectsArray = row.teachingSubjects
              .split(",")
              .map((s) => s.trim());
            const subjects = await Promise.all(
              subjectsArray.map(async (subjectStr) => {
                const [subjectName] = subjectStr.split(":");
                return await tx.subject.upsert({
                  where: { subjectName },
                  update: {},
                  create: { subjectName },
                });
              })
            );

            const teachingAssignments = await Promise.all(
              subjectsArray.map(async (subjectStr, idx) => {
                const [subjectName, gradeRaw, majorRaw, classNumber] =
                  subjectStr.split(":");

                if (
                  !gradeRaw ||
                  !majorRaw ||
                  !(gradeRaw in subjectsData) ||
                  !(majorRaw in subjectsData[gradeRaw as Grade].major)
                ) {
                  throw new Error(
                    `Invalid grade or major: ${gradeRaw}-${majorRaw}`
                  );
                }

                const grade = gradeRaw as Grade;
                const major = majorRaw as Major;

                const allowedSubjects = subjectsData[grade].major[major];

                if (!allowedSubjects.includes(subjectName)) {
                  throw new Error(
                    `${subjectName} not allowed for ${grade}-${major}`
                  );
                }

                return await tx.teachingAssignment.upsert({
                  where: {
                    teacherId_subjectId_grade_major_classNumber: {
                      teacherId: teacher.id,
                      subjectId: subjects[idx].id,
                      grade: grade as any,
                      major: major as any,
                      classNumber: classNumber,
                    },
                  },
                  update: {},
                  create: {
                    teacherId: teacher.id,
                    subjectId: subjects[idx].id,
                    grade: grade as any,
                    major: major as any,
                    classNumber: classNumber,
                  },
                });
              })
            );

            await tx.teacher.update({
              where: { id: teacher.id },
              data: {
                teachingAssignments: {
                  connect: teachingAssignments.map((ta) => ({ id: ta.id })),
                },
              },
            });
          }
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
    console.error("❌ Error bulk creating teachers:", error);
    return handleError(error);
  }
}
