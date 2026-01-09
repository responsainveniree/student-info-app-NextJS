// app/api/auth/bulk-create-teachers/route.ts
import { badRequest, handleError } from "@/lib/errors";
import { prisma } from "@/prisma/prisma";
import hashing from "@/lib/utils/hashing";
import { subjects as subjectsData } from "@/lib/utils/subjects";
import * as XLSX from "xlsx";
import { ClassNumber, GRADES, MAJORS } from "@/lib/constants/class";
import {
  formatClassNumber,
  getGradeNumber,
  getMajorDisplayName,
} from "@/lib/utils/labels";

interface TeacherRow {
  username: string;
  email: string;
  password: string;
  homeroomGrade?: Grade;
  homeroomMajor?: Major;
  homeroomClassNumber: string;
  teachingAssignments?: string; // Comma-separated: "math:tenth:accounting:1,english:eleventh:softwareEngineering:2"
  teachingClasses?: string; // Comma-separated: "tenth:accounting:1,eleventh:softwareEngineering:2"
}

type TeachingClass = {
  grade: Grade;
  major: Major;
  classNumber: ClassNumber;
};

type TeachingAssignment = {
  subject: string;
  grade: Grade;
  major: Major;
  classNumber: ClassNumber;
};

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

    // Process each teacher
    await prisma.$transaction(async (tx) => {
      for (let i = 0; i < data.length; i++) {
        const row = data[i];
        const rowNumber = i + 2;
        // Validate required fields
        if (!row.username || !row.email || !row.password) {
          throw badRequest(`Row ${rowNumber}: Missing required fields`);
        }

        // Validate grade and major
        if (row.homeroomGrade) {
          if (!GRADES.includes(row.homeroomGrade as Grade)) {
            throw badRequest(
              `Row ${rowNumber}: Invalid grade format in homeroom.`
            );
          }
        }

        if (row.homeroomMajor) {
          if (!MAJORS.includes(row.homeroomMajor as Major)) {
            throw badRequest(
              `Row ${rowNumber}: Invalid major format in homeroom.`
            );
          }
        }

        // Check if teacher already exists
        const existingTeacher = await tx.teacher.findUnique({
          where: { email: row.email },
        });

        if (existingTeacher) {
          throw badRequest(`Row ${rowNumber}:Email already registered`);
        }

        // Hash password
        const hashedPassword = await hashing(row.password);

        // Create teacher
        const teacher = await tx.teacher.create({
          data: {
            role: "TEACHER",
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
            throw badRequest(
              `Row ${rowNumber}: Homeroom class already has a teacher`
            );
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

        if (row.teachingClasses && row.teachingAssignments) {
          // Parse classes array & teaching assignments
          const parseClassesArray: TeachingClass[] = [];
          const parseTeachingAssignments: TeachingAssignment[] = [];

          // Handle Teaching Classes
          const classesArray = row.teachingClasses
            .split(",")
            .map((c) => c.trim());
          const teachingClasses = await Promise.all(
            classesArray.map(async (classStr) => {
              const [grade, major, classNumber] = classStr.split(":");

              if (grade) {
                if (!GRADES.includes(grade as Grade)) {
                  throw badRequest(
                    `Row ${rowNumber}: Invalid grade format in teaching classes.`
                  );
                }
              }

              if (major) {
                if (!MAJORS.includes(major as Major)) {
                  throw badRequest(
                    `Row ${rowNumber}: Invalid major format in teaching classes.`
                  );
                }
              }

              const classObject = {
                grade: grade as Grade,
                major: major as Major,
                classNumber: classNumber as ClassNumber,
              };

              parseClassesArray.push(classObject);

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

          // Handle Teaching Assignments
          const subjectsArray = row.teachingAssignments
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
              const [subjectName, grade, major, classNumber] =
                subjectStr.split(":");

              if (grade) {
                if (!GRADES.includes(grade as Grade)) {
                  throw badRequest(
                    `Row ${rowNumber}: Invalid grade format in teaching assignments.`
                  );
                }
              }

              if (major) {
                if (!MAJORS.includes(major as Major)) {
                  throw badRequest(
                    `Row ${rowNumber}: Invalid major format in teaching assignments.`
                  );
                }
              }

              if (
                !grade ||
                !major ||
                !(grade in subjectsData) ||
                !(major in subjectsData[grade as Grade].major)
              ) {
                throw badRequest(
                  `Row ${rowNumber}: Invalid grade or major: ${grade}-${major}`
                );
              }

              const allowedSubjects =
                subjectsData[grade as Grade].major[major as Major];

              if (!allowedSubjects.includes(subjectName)) {
                throw badRequest(
                  `Row ${rowNumber}: ${subjectName} not allowed for ${grade}-${major}`
                );
              }

              const assignmentObject = {
                subject: subjectName,
                grade: grade as Grade,
                major: major as Major,
                classNumber: classNumber as ClassNumber,
              };

              parseTeachingAssignments.push(assignmentObject);

              return await tx.teachingAssignment.upsert({
                where: {
                  teacherId_subjectId_grade_major_classNumber: {
                    teacherId: teacher.id,
                    subjectId: subjects[idx].id,
                    grade: grade as Grade,
                    major: major as Major,
                    classNumber: classNumber,
                  },
                },
                update: {},
                create: {
                  teacherId: teacher.id,
                  subjectId: subjects[idx].id,
                  grade: grade as Grade,
                  major: major as Major,
                  classNumber: classNumber,
                },
              });
            })
          );

          // Validation
          if (
            parseClassesArray.length > 0 &&
            parseTeachingAssignments.length > 0
          ) {
            // Check if every teaching assignment matches to one of the teaching classes
            for (const ta of parseTeachingAssignments) {
              const matchingClass = parseClassesArray.find((tc) => {
                return (
                  tc.grade == ta.grade &&
                  tc.major == ta.major &&
                  tc.classNumber == ta.classNumber
                );
              });

              if (!matchingClass) {
                const grade = getGradeNumber(ta.grade);
                const major = getMajorDisplayName(ta.major);
                const classNumber = formatClassNumber(ta.classNumber);

                throw badRequest(
                  `Row ${rowNumber}: Teaching Assignment mismatch! You have an assignment for ${grade}-${major} ${classNumber}, but this class is not in your Teaching Classes list. Please add it to Teaching Classes first.`
                );
              }
            }

            // Check if every teaching classes matches to one of the teaching assignments
            for (const tc of parseClassesArray) {
              const macthingAssignments = parseTeachingAssignments.find(
                (ta) =>
                  ta.major === tc.major &&
                  ta.grade === tc.grade &&
                  ta.classNumber === tc.classNumber
              );

              if (!macthingAssignments) {
                const grade = getGradeNumber(tc.grade);
                const major = getMajorDisplayName(tc.major);
                const classNumber = formatClassNumber(tc.classNumber);

                throw badRequest(
                  `Teaching Classes mismatch! You have an teaching classes for ${grade}-${major} ${classNumber}, but this class is not in your Teaching Assigments list. Please add it to Teaching Assignments also.`
                );
              }
            }
          }

          // Check for duplicate assignments (same subject in same class)
          const assignmentKeys = new Set<string>();
          for (const ta of parseTeachingAssignments) {
            const key = `${ta.grade}-${ta.major}-${ta.classNumber}-${ta.subject}`;
            if (assignmentKeys.has(key)) {
              const grade = getGradeNumber(ta.grade);
              const major = getMajorDisplayName(ta.major);
              const classNumber = formatClassNumber(ta.classNumber);

              throw badRequest(
                `Duplicate assignment detected! You cannot teach "${ta.subject}" more than once in ${grade}-${major} ${classNumber}.`
              );
            }
            assignmentKeys.add(key);
          }

          // Check if another teacher already teaches this subject in this class
          for (const ta of parseTeachingAssignments) {
            const existingAssignment = await tx.teachingAssignment.findFirst({
              where: {
                grade: ta.grade,
                major: ta.major,
                classNumber: ta.classNumber,
                subject: {
                  subjectName: ta.subject,
                },
              },
              include: {
                teacher: {
                  select: { name: true },
                },
              },
            });

            if (existingAssignment) {
              const grade = getGradeNumber(ta.grade);
              const major = getMajorDisplayName(ta.major);
              const classNumber = formatClassNumber(ta.classNumber);

              throw badRequest(
                `Assignment conflict! Teacher "${existingAssignment.teacher.name}" already teaches "${ta.subject}" in ${grade}-${major} ${classNumber}.`
              );
            }
          }

          await tx.teacher.update({
            where: { id: teacher.id },
            data: {
              teachingAssignments: {
                connect: teachingAssignments.map((ta) => ({ id: ta.id })),
              },
            },
          });
        }
      }
    });

    return Response.json(
      {
        message: `Bulk import completed.`,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("API_ERROR", {
      route: "/api/auth/account/bulk/teacher-accounts",
      message: error instanceof Error ? error.message : String(error),
    });
    return handleError(error);
  }
}
