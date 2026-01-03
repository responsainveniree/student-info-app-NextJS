import { badRequest, handleError } from "@/lib/errors";
import { prisma } from "@/prisma/prisma";
import hashing from "@/lib/utils/hashing";
import { zodTeacherSignUp, TeacherSignUpInput } from "@/lib/utils/zodSchema";
import { subjects as subjectsData } from "@/lib/utils/subjects";
import { classNumberLabel, gradeLabel, majorLabel } from "@/lib/utils/labels";

export async function POST(req: Request) {
  try {
    const data: TeacherSignUpInput = await req.json();

    zodTeacherSignUp.parse(data);

    if (data.password !== data.confirmPassword) {
      throw badRequest("Password and confirm password must be the same");
    }

    const existingTeacher = await prisma.teacher.findUnique({
      where: { email: data.email },
    });

    if (existingTeacher) {
      throw badRequest("Email already registered");
    }

    const hashedPassword = await hashing(data.password);

    await prisma.$transaction(async (tx) => {
      // create teacher account
      const teacher = await tx.teacher.create({
        data: {
          role: "TEACHER",
          name: data.username,
          email: data.email,
          password: hashedPassword,
        },
        select: {
          id: true,
          name: true,
          email: true,
          createdAt: true,
        },
      });

      // Handle homeroom class
      if (data.homeroomClass?.grade && data.homeroomClass.major) {
        const existingHomeroomClass = await tx.homeroomClass.findFirst({
          where: {
            grade: data.homeroomClass.grade,
            major: data.homeroomClass.major,
            classNumber: data.homeroomClass.classNumber,
          },
        });

        if (existingHomeroomClass) {
          throw badRequest(
            `There is already a homeroom teacher in ${
              data.homeroomClass.grade === "TWELFTH"
                ? "12"
                : data.homeroomClass.grade === "ELEVENTH"
                  ? "11"
                  : "10"
            }-${
              data.homeroomClass.major === "SOFTWARE_ENGINEERING"
                ? "Software Engineering"
                : "Accounting"
            } ${
              data.homeroomClass.classNumber === "none"
                ? ""
                : data.homeroomClass.classNumber
            }`
          );
        }
        await tx.homeroomClass.create({
          data: {
            grade: data.homeroomClass.grade,
            major: data.homeroomClass.major,
            classNumber: data.homeroomClass.classNumber,

            teacherId: teacher.id,
          },
        });
      }

      if (
        Array.isArray(data.teachingClasses) &&
        data.teachingClasses.length > 0 &&
        Array.isArray(data.teachingAssignment) &&
        data.teachingAssignment.length > 0
      ) {
        // VALIDATION 1: Check if every teaching assignment matches one of the teaching classes
        for (const ta of data.teachingAssignment) {
          const matchingClass = data.teachingClasses.find(
            (tc) =>
              tc.grade === ta.grade &&
              tc.major === ta.major &&
              tc.classNumber === ta.classNumber
          );

          if (!matchingClass) {
            const grade = gradeLabel(ta.grade);
            const major = majorLabel(ta.major);
            const classNumber = classNumberLabel(ta.classNumber);

            throw badRequest(
              `Teaching Assignment mismatch! You have an assignment for ${grade}-${major} ${classNumber}, but this class is not in your Teaching Classes list. Please add it to Teaching Classes first.`
            );
          }
        }

        // VALIDATION 2: Check if every teaching Classes matches one of the taeching assignments
        for (const tc of data.teachingClasses) {
          const macthingAssignments = data.teachingAssignment.find(
            (ta) =>
              ta.major === tc.major &&
              ta.grade === tc.grade &&
              ta.classNumber === tc.classNumber
          );

          if (!macthingAssignments) {
            const grade = gradeLabel(tc.grade);
            const major = majorLabel(tc.major);
            const classNumber = classNumberLabel(tc.classNumber);

            throw badRequest(
              `Teaching Classes mismatch! You have an teaching classes for ${grade}-${major} ${classNumber}, but this class is not in your Teaching Assigments list. Please add it to Teaching Assignments also.`
            );
          }
        }

        // VALIDATION 3: Check if the subject is valid for that specific class
        for (const ta of data.teachingAssignment) {
          const allowedSubjects = subjectsData[ta.grade].major[ta.major];

          if (!allowedSubjects.includes(ta.subjectName)) {
            const grade = gradeLabel(ta.grade);
            const major = majorLabel(ta.major);
            const classNumber = classNumberLabel(ta.classNumber);

            throw badRequest(
              `Subject mismatch! The subject "${ta.subjectName}" is not available for ${grade}-${major} ${classNumber}. Please check the curriculum.`
            );
          }
        }

        // Handle teaching classes
        const teachingClasses = await Promise.all(
          data.teachingClasses.map(async (teachingClass) => {
            return await tx.teachingClass.upsert({
              where: {
                grade_major_classNumber: {
                  grade: teachingClass.grade,
                  major: teachingClass.major,
                  classNumber: teachingClass.classNumber as string,
                },
              },
              update: {},
              create: {
                grade: teachingClass.grade,
                major: teachingClass.major,
                classNumber: teachingClass.classNumber,
              },
            });
          })
        );

        await tx.teacher.update({
          where: { id: teacher.id },
          data: {
            teachingClasses: {
              connect: teachingClasses.map((teachingClass) => ({
                id: teachingClass.id,
              })),
            },
          },
        });

        // Handle Teaching Assignments
        const subjects = await Promise.all(
          data.teachingAssignment.map(async (assignment) => {
            return await tx.subject.upsert({
              where: {
                subjectName: assignment.subjectName,
              },
              update: {},
              create: { subjectName: assignment.subjectName },
            });
          })
        );

        const teachingAssignments = await Promise.all(
          data.teachingAssignment.map(async (assignment, i) => {
            return await tx.teachingAssignment.upsert({
              where: {
                teacherId_subjectId_grade_major_classNumber: {
                  teacherId: teacher.id,
                  subjectId: subjects[i].id,
                  grade: assignment.grade,
                  major: assignment.major,
                  classNumber: assignment.classNumber as string,
                },
              },
              update: {},
              create: {
                teacherId: teacher.id,
                subjectId: subjects[i].id,
                grade: assignment.grade,
                major: assignment.major,
                classNumber: assignment.classNumber,
              },
            });
          })
        );

        await tx.teacher.update({
          where: { id: teacher.id },
          data: {
            teachingAssignments: {
              connect: teachingAssignments.map((assignment) => ({
                id: assignment.id,
              })),
            },
          },
        });
      }
    });

    return Response.json(
      {
        message: "Successfully created teacher account",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating teacher:", error);
    return handleError(error);
  }
}
