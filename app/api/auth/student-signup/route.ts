import { badRequest, handleError, notFound } from "@/lib/errors";
import { prisma } from "@/prisma/prisma";
import hashing from "@/lib/utils/hashing";
import { zodStudentSignUp } from "@/lib/utils/zodSchema";
import subjects from "@/lib/utils/subjects";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const data = zodStudentSignUp.parse(body);

    if (data.password !== data.confirmPassword) {
      throw badRequest("Passwords do not match");
    }

    const existingStudent = await prisma.student.findUnique({
      where: { email: data.email },
    });

    if (existingStudent) {
      throw badRequest("Email already registered");
    }

    const existingTeacher = await prisma.teacher.findUnique({
      where: { name: data.teacherName },
      select: {
        id: true,
      },
    });

    if (!existingTeacher) {
      throw notFound("Teacher not found");
    }

    const hashedPassword = await hashing(data.password);

    const user = await prisma.student.create({
      data: {
        name: data.username,
        email: data.email,
        password: hashedPassword,
        grade: data.grade,
        major: data.major ?? null,
        classNumber: data.classNumber ?? null,
        isVerified: true,
        teacherId: existingTeacher.id,
      },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
      },
    });

    const subjectsList = subjects[data.grade]?.major?.[data.major] ?? [];

    if (subjectsList.length === 0) {
      throw badRequest("Subject configuration not found");
    }

    const subjectRecords = await Promise.all(
      subjectsList.map(async (subjectName) => {
        return prisma.subject.upsert({
          where: { subjectName },
          update: {},
          create: { subjectName },
        });
      })
    );

    await prisma.student.update({
      where: { id: user.id },
      data: {
        studentSubjects: {
          connect: subjectRecords.map((s) => ({ id: s.id })),
        },
      },
    });

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
