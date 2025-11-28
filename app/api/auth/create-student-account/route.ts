import { badRequest, handleError, notFound } from "@/lib/errors";
import { prisma } from "@/prisma/prisma";
import hashing from "@/lib/utils/hashing";
import { zodStudentSignUp } from "@/lib/utils/zodSchema";
import subjects from "@/lib/utils/subjects";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const data = zodStudentSignUp.parse(body);

    console.log("📝 Received data:", data);

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

    // Convert classNumber properly
    const classNumberValue = data.classNumber === "0" ? null : data.classNumber;

    const user = await prisma.student.create({
      data: {
        name: data.username,
        email: data.email,
        password: hashedPassword,
        grade: data.grade,
        major: data.major,
        classNumber: classNumberValue,
        isVerified: true,
        teacherId: existingTeacher.id,
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
        const subject = await prisma.subject.upsert({
          where: { subjectName },
          update: {},
          create: { subjectName },
        });
        return subject;
      })
    );

    // Connect subjects to student
    const updatedStudent = await prisma.student.update({
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

    return Response.json(
      {
        message: "Successfully signed up",
        data: {
          user: {
            id: updatedStudent.id,
            name: updatedStudent.name,
            email: updatedStudent.email,
            grade: updatedStudent.grade,
            major: updatedStudent.major,
            subjectsCount: updatedStudent.studentSubjects.length,
          },
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("❌ Error creating student:", error);
    return handleError(error);
  }
}
