import {
  badRequest,
  forbidden,
  handleError,
  notFound,
  unauthorized,
} from "@/lib/errors";
import { prisma } from "@/prisma/prisma";
import hashing from "@/lib/utils/hashing";
import { studentSignUpSchema } from "@/lib/utils/zodSchema";
import { subjects } from "@/lib/utils/subjects";
import crypto from "crypto";
import { getSemester } from "@/lib/utils/date";
import { isStaffRole } from "@/lib/constants/roles";
import { auth } from "@/lib/auth/authNode";
import { Semester } from "@/lib/constants/class";

export async function POST(req: Request) {
  try {
    const session = await auth();

    if (!session) {
      throw unauthorized("You haven't logged in yet");
    }

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
        id: session.user.id,
      },
      select: {
        role: true,
      },
    });

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
          id: true,
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
          homeroomClassId: homeroomClass.id,
          role: data.studentRole,
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

      const existingSubjects = await tx.subject.findMany({
        where: {
          subjectName: {
            in: subjectsList,
          },
        },
        select: {
          id: true,
          subjectName: true,
        },
      });

      const existingSubjectNames = existingSubjects.map((s) => s.subjectName);

      const missingSubjects = subjectsList.filter(
        (name) => !existingSubjectNames.includes(name),
      );

      if (missingSubjects.length > 0) {
        await tx.subject.createMany({
          data: missingSubjects.map((name) => ({ subjectName: name })),
          skipDuplicates: true,
        });
      }

      let allSubjects = await tx.subject.findMany({
        where: {
          subjectName: {
            in: subjectsList,
          },
        },
        select: {
          id: true,
        },
      });

      const subjectRecordIds = allSubjects.map((s) => s.id);

      //Upsert all subjectmMark
      const today = new Date();
      // We only have 2 semsesters. In DB we describe as "FIRST" and "SECOND"
      const currentSemester = getSemester(today) === 1 ? "FIRST" : "SECOND";

      const subjectMarkRecords = await Promise.all(
        subjectsList.map(async (subjectName) => {
          return {
            studentId: student.id,
            subjectName: subjectName,
            academicYear: String(new Date().getFullYear()),
            semester: currentSemester as Semester,
          };
        }),
      );

      await tx.subjectMark.createMany({
        data: subjectMarkRecords,
      });

      const createdMarks = await tx.subjectMark.findMany({
        where: {
          studentId: student.id,
          academicYear: String(new Date().getFullYear()),
          semester: currentSemester as Semester,
        },
        select: {
          id: true,
        },
      });

      // Connect subjectMark to student
      await tx.student.update({
        where: { id: student.id },
        data: {
          studentSubjects: {
            connect: subjectRecordIds.map((subjectId) => ({ id: subjectId })),
          },
          subjectMarks: {
            connect: createdMarks.map((mark) => ({
              id: mark.id,
            })),
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
