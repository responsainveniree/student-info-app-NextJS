import { badRequest, handleError, notFound } from "@/lib/errors";
import { prisma } from "@/prisma/prisma";
import hashing from "@/lib/utils/hashing";
import { zodStudentSignUp } from "@/lib/utils/zodSchema";
import { subjects } from "@/lib/utils/subjects";
import crypto from "crypto";
import { getSemester } from "@/lib/utils/date";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const data = zodStudentSignUp.parse(body);

    let parentAccount;

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

      const student = await tx.student.create({
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
        where: { id: student.id },
        data: {
          studentSubjects: {
            connect: subjectRecords.map((s) => ({ id: s.id })),
          },
        },
        include: {
          studentSubjects: true,
        },
      });

      //Upsert all subjectmMark
      const today = new Date();
      const currentSemester = getSemester(today);

      const subjectMarkRecords = await Promise.all(
        subjectsList.map(async (subjectName) => {
          const subjectMark = await tx.subjectMark.upsert({
            where: {
              studentId_subjectName_academicYear_semester: {
                studentId: student.id,
                subjectName: subjectName,
                academicYear: String(new Date().getFullYear()),
                semester: currentSemester === 1 ? "FIRST" : "SECOND",
              },
            },
            update: {},
            create: {
              studentId: student.id,
              subjectName: subjectName,
              academicYear: String(new Date().getFullYear()),
              semester: currentSemester === 1 ? "FIRST" : "SECOND",
            },
          });
          return subjectMark;
        })
      );

      // Connect subjectMark to student
      await tx.student.update({
        where: { id: student.id },
        data: {
          subjectMarks: {
            connect: subjectMarkRecords.map((subjectMark) => ({
              id: subjectMark.id,
            })),
          },
        },
        include: {
          subjectMarks: true,
        },
      });

      const rawRandomPassword = crypto.randomBytes(8).toString("hex");
      const hashRandomPassword = await hashing(rawRandomPassword);

      await tx.parent.upsert({
        where: {
          studentId: student.id,
        },
        update: {},
        create: {
          email: `${student.name.toLowerCase().replaceAll(" ", "")}parentaccount@gmail.com`,
          name: `${student.name}'s Parents`,
          password: hashRandomPassword,
          role: "PARENT",
          studentId: student.id,
        },
      });

      parentAccount = {
        email: `${student.name.toLowerCase().replaceAll(" ", "")}parentaccount@gmail.com`,
        password: rawRandomPassword,
      };
    });

    return Response.json(
      {
        message: "Student account created successfully",
        data: {
          parentAccount: parentAccount,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("API_ERROR", {
      route: "/api/auth/account/single/student-account",
      message: error instanceof Error ? error.message : String(error),
    });
    return handleError(error);
  }
}
