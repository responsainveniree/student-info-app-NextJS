import { badRequest, handleError } from "@/lib/errors";
import { prisma } from "@/prisma/prisma";
import hashing from "@/lib/utils/hashing";
import {
  zodTeacherSignUp,
  zodTeacherSignUpSchema,
} from "@/lib/utils/zodSchema";

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

    const user = await prisma.teacher.create({
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

    if (data.homeroomClass.grade != null && data.homeroomClass.major != null) {
      const homeroomClassObject = await prisma.homeroomClass.upsert({
        where: {
          grade_major_classNumber: {
            grade: data.homeroomClass.grade,
            major: data.homeroomClass.major,
            classNumber: data.homeroomClass.classNumber ?? null,
          },
        },
        update: {},
        create: {
          grade: data.homeroomClass.grade,
          major: data.homeroomClass.major,
          classNumber: data.homeroomClass.classNumber ?? null,
          teacherId: user.id,
        },
      });

      await prisma.teacher.update({
        where: { id: user.id },
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
                classNumber: teachingClass.classNumber,
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
        where: { id: user.id },
        data: {
          teachingClasses: {
            connect: teachingClasses.map((teachingClass) => ({
              id: teachingClass.id,
            })),
          },
        },
      });
    }

    return Response.json(
      {
        message: "Successfully signed up",
        data: { user },
      },
      { status: 201 }
    );
  } catch (error) {
    return handleError(error);
  }
}
