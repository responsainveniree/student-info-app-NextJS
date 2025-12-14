import { badRequest, handleError } from "@/lib/errors";
import { prisma } from "@/prisma/prisma";
import hashing from "@/lib/utils/hashing";
import { zodTeacherSignUp } from "@/lib/utils/zodSchema";
import { subjects as subjectsData } from "@/lib/utils/subjects";

export async function POST(req: Request) {
  try {
    const data = zodTeacherSignUp.parse(await req.json());

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

    const result = await prisma.$transaction(async (tx) => {
      const teacher = await tx.teacher.create({
        data: {
          role: "teacher",
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

      // Handle Homeroom Class
      if (data.homeroomClass?.grade && data.homeroomClass.major) {
        const existingHomeroomClass = await tx.homeroomClass.findFirst({
          where: {
            grade: data.homeroomClass.grade,
            major: data.homeroomClass.major,
            classNumber: data.homeroomClass.classNumber,
          },
        });

        if (existingHomeroomClass) {
          throw badRequest("There is already a homeroom teacher in this class");
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

      // Handle Teaching Classes
      if (
        Array.isArray(data.teachingClasses) &&
        data.teachingClasses.length > 0
      ) {
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
      }

      // Handle Teaching Assignments
      if (
        Array.isArray(data.teachingAssignment) &&
        data.teachingAssignment.length > 0
      ) {
        // First, get or create all subjects
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

        // Create teaching assignments with correct data
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

        for (const assignment of data.teachingAssignment) {
          const allowedSubjects =
            subjectsData[assignment.grade].major[assignment.major];

          if (!allowedSubjects.includes(assignment.subjectName)) {
            throw badRequest(
              `Class ${
                assignment.grade === "twelfth"
                  ? "12"
                  : assignment.grade === "eleventh"
                  ? "11"
                  : "10"
              }-${
                assignment.major === "accounting"
                  ? "Accounting"
                  : "Software Engineer"
              } does not have ${assignment.subjectName}`
            );
          }
        }

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
        message: "Successfully create teacher account",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating teacher:", error);
    return handleError(error);
  }
}
