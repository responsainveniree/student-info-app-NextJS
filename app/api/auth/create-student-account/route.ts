import { badRequest, handleError, notFound } from "@/lib/errors";
import { prisma } from "@/prisma/prisma";
import hashing from "@/lib/utils/hashing";
import { zodStudentSignUp } from "@/lib/utils/zodSchema";
import { subjects } from "@/lib/utils/subjects";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const data = zodStudentSignUp.parse(body);

    await prisma.$transaction(async (tx) => {
      if (data.password !== data.confirmPassword) {
        throw badRequest("Passwords do not match");
      }

      const existingStudent = await tx.student.findUnique({
        where: { email: data.email },
      });

      if (existingStudent) {
        throw badRequest("Email already registered");
      }

      const hashedPassword = await hashing(data.password);

      const homeroomClass = await tx.homeroomClass.findFirst({
        where: {
          grade: data.grade,
          major: data.major,
          classNumber: data.classNumber,
        },
        select: {
          teacherId: true,
        },
      });

      if (!homeroomClass) {
        throw notFound("Homeroom class not found");
      }

      const user = await tx.student.create({
        data: {
          name: data.username,
          email: data.email,
          password: hashedPassword,
          grade: data.grade,
          major: data.major,
          classNumber: data.classNumber,
          isVerified: true,
          homeroomTeacherId: homeroomClass?.teacherId as string,
          role: data.role,
        },
        select: {
          id: true,
          name: true,
          email: true,
          grade: true,
          major: true,
          createdAt: true,
        },
      });

      // Get subject list based on grade and major
      const subjectsList = subjects[data.grade]?.major?.[data.major] ?? [];

      if (subjectsList.length === 0) {
        throw badRequest(
          "Subject configuration not found for this grade and major"
        );
      }

      // Upsert all subjects first
      const subjectRecords = await Promise.all(
        subjectsList.map(async (subjectName) => {
          const subject = await tx.subject.upsert({
            where: { subjectName },
            update: {},
            create: { subjectName },
          });
          return subject;
        })
      );

      // Connect subjects to student
      await tx.student.update({
        where: { id: user.id },
        data: {
          studentSubjects: {
            connect: subjectRecords.map((s) => ({ id: s.id })),
          },
        },
        include: {
          studentSubjects: true,
        },
      });
    });

    return Response.json(
      {
        message: "Successfully created student account",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("❌ Error creating student:", error);
    return handleError(error);
  }
}
