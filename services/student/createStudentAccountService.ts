import { prisma } from "@/db/prisma";
import crypto from "crypto";
import hashing from "../../lib/utils/hashing";
import { getSemester } from "../../lib/utils/date";
import { ensureSubjectsExist } from "../../domain/subject/subjectRules";
import { ensureEmailExist } from "../../domain/student/emailRules";
import { findSubjectsForClass } from "../../repositories/subjectRepository";
import { findClassroom } from "@/repositories/classroomRepository";
import { findUserByEmail } from "@/repositories/userRepository";
import { Prisma } from "@prisma/client";
import { ensureClassroomExists } from "@/domain/classroom/classroomRules";

export async function createStudentAccountService(data: any) {
  const subjects = await findSubjectsForClass(
    data.classSchema.grade,
    data.classSchema.major,
  );

  ensureSubjectsExist(subjects);

  return prisma.$transaction(async (tx) => {
    const existingStudent = await findUserByEmail(data.email, tx);

    ensureEmailExist(existingStudent);

    const classroom = await findClassroom(
      data.classSchema.grade,
      data.classSchema.major,
      data.classSchema.section,
      tx,
    );

    ensureClassroomExists(classroom);

    const hashedPassword = await hashing(data.passwordSchema.password);

    const student = await tx.user.create({
      data: {
        name: data.username,
        email: data.email,
        password: hashedPassword,
        role: "STUDENT",
        studentProfile: {
          create: {
            classId: classroom.id,
            studentRole: data.studentRole,
          },
        },
      },
      select: {
        id: true,
        name: true,
      },
    });

    const today = new Date();
    const semester = getSemester(today) === 1 ? "FIRST" : "SECOND";

    const gradebooks: Prisma.GradebookCreateManyInput[] = subjects.map(
      (subject) => ({
        studentId: student.id,
        subjectId: subject.id,
        academicYear: String(today.getFullYear()),
        semester,
      }),
    );

    await tx.gradebook.createMany({
      data: gradebooks,
    });

    const rawParentPassword = crypto.randomBytes(8).toString("hex");
    const hashedParentPassword = await hashing(rawParentPassword);

    const parentEmail = `${student.name
      .trim()
      .toLowerCase()
      .replaceAll(" ", "")}${student.id.slice(0, 4)}parentaccount@gmail.com`;

    await tx.user.create({
      data: {
        email: parentEmail,
        name: `${student.name}'s Parents`,
        password: hashedParentPassword,
        role: "PARENT",
        parentProfile: {
          create: {
            studentId: student.id,
          },
        },
      },
    });

    return {
      parentAccount: {
        email: parentEmail,
        password: rawParentPassword,
      },
    };
  });
}
