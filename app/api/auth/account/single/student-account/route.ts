import { badRequest, forbidden, handleError, notFound } from "@/lib/errors";
import { prisma } from "@/prisma/prisma";
import hashing from "@/lib/utils/hashing";
import { studentSignUpSchema } from "@/lib/utils/zodSchema";
import { subjects } from "@/lib/utils/subjects";
import crypto from "crypto";
import { getSemester } from "@/lib/utils/date";
import { isStaffRole } from "@/lib/constants/roles";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const data = studentSignUpSchema.parse(body);

    let parentAccount: {
      email: string;
      password: string;
    } = {
      email: "",
      password: "",
    };

    // Staff are users authorized to create student and teacher accounts.
    // Valid staff roles: "PRINCIPAL" and "VICE_PRINCIPAL".
    const staff = await prisma.teacher.findUnique({
      where: {
        id: data.creatorId,
      },
      select: {
        role: true,
      },
    });

    console.log("test: ", data);

    if (!staff) {
      throw badRequest("User not found");
    }

    if (!isStaffRole(staff?.role)) {
      throw forbidden("You're not allowed");
    }

    await prisma.$transaction(async (tx) => {
      const existingStudent = await tx.student.findUnique({
        where: { email: data.email },
      });

      if (existingStudent) {
        throw badRequest("Email already registered");
      }

      const hashedPassword = await hashing(data.passwordSchema.password);

      const homeroomClass = await tx.homeroomClass.findFirst({
        where: {
          grade: data.classSchema.grade,
          major: data.classSchema.major,
          classNumber: data.classSchema.classNumber,
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
          grade: data.classSchema.grade,
          major: data.classSchema.major,
          classNumber: data.classSchema.classNumber,
          isVerified: true,
          homeroomTeacherId: homeroomClass?.teacherId as string,
          role: data.role,
        },
        select: {
          id: true,
          name: true,
        },
      });

      // Get subject list based on grade and major
      const subjectsList =
        subjects[data.classSchema.grade]?.major?.[data.classSchema.major] ?? [];

      if (subjectsList.length === 0) {
        throw badRequest(
          "Subject configuration not found for this grade and major",
        );
      }

      // Upsert all subjects first
      const subjectRecords = await Promise.all(
        subjectsList.map(async (subjectName) => {
          const subject = await tx.subject.upsert({
            where: { subjectName },
            update: {},
            create: { subjectName },
            select: {
              id: true,
            },
          });
          return subject;
        }),
      );

      //Upsert all subjectmMark
      const today = new Date();
      // We only have 2 semsesters. In DB we describe as "FIRST" and "SECOND"
      const currentSemester = getSemester(today) === 1 ? "FIRST" : "SECOND";

      const subjectMarkRecords = await Promise.all(
        subjectsList.map(async (subjectName) => {
          const subjectMark = await tx.subjectMark.createMany({
            data: {
              studentId: student.id,
              subjectName: subjectName,
              academicYear: String(new Date().getFullYear()),
              semester: currentSemester,
            },
            skipDuplicates: true,
          });
          return subjectMark;
        }),
      );

      const academicYear = String(new Date().getFullYear());

      const createdMarks = await tx.subjectMark.findMany({
        where: {
          studentId: student.id,
          academicYear,
          semester: currentSemester,
        },
        select: { id: true },
      });

      // Connect subjectMark to student
      await tx.student.update({
        where: { id: student.id },
        data: {
          studentSubjects: {
            connect: subjectRecords.map((s) => ({ id: s.id })),
          },
          subjectMarks: {
            connect: createdMarks.map((m) => ({ id: m.id })),
          },
        },
      });

      const rawRandomPassword = crypto.randomBytes(8).toString("hex");
      const hashRandomPassword = await hashing(rawRandomPassword);

      await tx.parent.create({
        data: {
          email: `${student.name.toLowerCase().replaceAll(" ", "")}parentaccount@gmail.com`,
          name: `${student.name}'s Parents`,
          password: hashRandomPassword,
          role: "PARENT",
          studentId: student.id,
        },
        select: {
          role: true,
        },
      });

      const parentAccountEmail = `${student.name.trim().toLowerCase().replaceAll(" ", "")}${student.id.slice(0, 4)}parentaccount@gmail.com`;

      parentAccount = {
        email: parentAccountEmail,
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
      { status: 200 },
    );
  } catch (error) {
    console.error("API_ERROR", {
      route: "/api/auth/account/single/student-account",
      message: error instanceof Error ? error.message : String(error),
    });
    return handleError(error);
  }
}
