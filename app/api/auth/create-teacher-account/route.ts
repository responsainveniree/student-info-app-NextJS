import { badRequest, handleError } from "@/lib/errors";
import { prisma } from "@/prisma/prisma";
import hashing from "@/lib/utils/hashing";
import {
  zodTeacherSignUp,
  zodTeacherSignUpSchema,
} from "@/lib/utils/zodSchema";
import Subject from "@/lib/types/subjectType";

export async function POST(req: Request) {
  try {
    const data: zodTeacherSignUpSchema = await req.json();

    zodTeacherSignUp.parse(data);

    if (data.password !== data.confirmPassword) {
      throw badRequest("Password and confirm password must be the same");
    }

    const existingTeacher = await prisma.student.findUnique({
      where: { email: data.email },
    });

    if (existingTeacher) {
      throw badRequest("Email already registered");
    }

    const hashedPassword = await hashing(data.password);

    if (!data.homeroomClass?.grade || !data.homeroomClass.major) {
      throw badRequest("All field must be filled");
    }

    const teacher = await prisma.teacher.create({
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

    const existingHomeroomClass = await prisma.homeroomClass.findUnique({
      where: {
        grade_major_classNumber: {
          grade: data.homeroomClass.grade,
          major: data.homeroomClass.major,
          classNumber: data.homeroomClass.classNumber as string,
        },
      },
    });

    if (existingHomeroomClass) {
      throw badRequest("There has already a homeroom teacher in this class");
    }

    if (data.homeroomClass.grade != null && data.homeroomClass.major != null) {
      const homeroomClassObject = await prisma.homeroomClass.upsert({
        where: {
          grade_major_classNumber: {
            grade: data.homeroomClass.grade,
            major: data.homeroomClass.major,
            classNumber: ((data.homeroomClass.classNumber as string) === "none"
              ? null
              : (data.homeroomClass.classNumber as string)) as any,
          },
        },
        update: {},
        create: {
          grade: data.homeroomClass.grade,
          major: data.homeroomClass.major,
          classNumber: data.homeroomClass.classNumber ?? null,
          teacherId: teacher.id,
        },
      });

      await prisma.teacher.update({
        where: { id: teacher.id },
        data: {
          homeroomClass: {
            connect: { id: homeroomClassObject.id },
          },
        },
      });
    }

    if (
      Array.isArray(data.teachingClasses) &&
      data.teachingClasses.length > 0
    ) {
      const teachingClasses = await Promise.all(
        data.teachingClasses.map(async (teachingClass) => {
          return await prisma.teachingClass.upsert({
            where: {
              grade_major_classNumber: {
                grade: teachingClass.grade,
                major: teachingClass.major,
                classNumber:
                  (teachingClass.classNumber as string) === "none"
                    ? null
                    : (teachingClass.classNumber as string as any),
              },
            },
            update: {},
            create: {
              grade: teachingClass.grade,
              major: teachingClass.major,
              classNumber: teachingClass.classNumber ?? null,
            },
          });
        })
      );

      await prisma.teacher.update({
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

    let subjects: Subject[];

    const subjectsName =
      data.teachingAssignment?.map((t) => t.subjectName) ?? [];

    if (subjectsName.length != 0) {
      subjects = await Promise.all(
        subjectsName.map(async (subjectName) => {
          return await prisma.subject.upsert({
            where: {
              subjectName,
            },
            update: {},
            create: { subjectName: subjectName },
          });
        })
      );
    }

    if (
      Array.isArray(data.teachingAssignment) &&
      data.teachingAssignment.length > 0
    ) {
      const teachingAssignments = await Promise.all(
        data.teachingAssignment.map(async (teachingAssignment, i) => {
          return await prisma.teachingAssignment.upsert({
            where: {
              teacherId_subjectId_grade_major_classNumber: {
                teacherId: teacher.id,
                subjectId: subjects[i].id as number,
                grade: teachingAssignment.grade,
                major: teachingAssignment.major,
                classNumber:
                  (teachingAssignment.classNumber as string) === "none"
                    ? null
                    : (teachingAssignment.classNumber as string as any),
              },
            },
            update: {},
            create: {
              teacherId: teacher.id,
              subjectId: 1,
              grade: "tenth",
              major: "accounting",
              classNumber:
                (teachingAssignment.classNumber as string) === "none"
                  ? null
                  : (teachingAssignment.classNumber as string as any),
            },
          });
        })
      );

      await prisma.teacher.update({
        where: { id: teacher.id },
        data: {
          teachingAssignments: {
            connect: teachingAssignments.map((teachingAssignment) => ({
              id: teachingAssignment.id,
            })),
          },
        },
      });
    }

    return Response.json(
      {
        message: "Successfully signed up",
        data: { teacher },
      },
      { status: 201 }
    );
  } catch (error) {
    return handleError(error);
  }
}
