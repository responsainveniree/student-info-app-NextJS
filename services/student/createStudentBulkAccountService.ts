import { prisma } from "@/db/prisma";
import { validateExcelExtension } from "@/domain/extension/extensionRules";
import { ClassSection, Grade, Major } from "@/lib/constants/class";
import { StudentPosition } from "@/lib/constants/roles";
import { badRequest } from "@/lib/errors";
import { getSemester } from "@/lib/utils/date";
import hashing from "@/lib/utils/hashing";
import { Prisma } from "@prisma/client";
import * as XLSX from "xlsx";
import crypto from "crypto";
import { createId } from "@paralleldrive/cuid2";
import { getFullClassLabel } from "@/lib/utils/labels";

type StudentExcelRow = {
  username: string;
  email: string;
  password: string;
  grade: Grade;
  major: Major;
  section: ClassSection;
  studentRole: StudentPosition;
};

export async function createStudentBulkAccountService(file: File) {
  validateExcelExtension(file);

  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer);
  const data = XLSX.utils.sheet_to_json(
    workbook.Sheets[workbook.SheetNames[0]],
  ) as StudentExcelRow[];

  if (data.length === 0) throw badRequest("Excel file is empty");

  // PRE-FETCH DATA FOR VALIDATION
  const excelEmails = data.map((row) => row.email).filter(Boolean);
  const [existingUsers, allClassrooms, allSubjects] = await Promise.all([
    prisma.user.findMany({
      where: { email: { in: excelEmails } },
      select: { email: true },
    }),
    prisma.classroom.findMany(),
    // Get subject config for filtering
    prisma.subject.findMany({
      include: { config: true },
    }),
  ]);

  const existingEmailSet = new Set(
    existingUsers.map((u: { email: string }) => u.email),
  );
  const classroomMap = new Map<string, number>(
    allClassrooms.map((c) => [`${c.grade}-${c.major}-${c.section}`, c.id]),
  );

  // PREPARE COLLECTIONS
  const usersToCreate: Prisma.UserCreateManyInput[] = [];
  const studentProfilesToCreate: Prisma.StudentCreateManyInput[] = [];
  const parentsToCreate: Prisma.ParentCreateManyInput[] = [];
  const gradebooksToCreate: Prisma.GradebookCreateManyInput[] = [];
  const parentAccountsForExcel: any[] = [];

  const semester = getSemester(new Date()) === 1 ? "FIRST" : "SECOND";

  // Student Password
  const parentPasswordMap = new Map();

  // VALIDATE (IN-MEMORY)
  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    const rowNum = i + 2;

    if (
      !row.username ||
      !row.email ||
      !row.password ||
      !row.grade ||
      !row.major ||
      !row.section
    ) {
      throw badRequest(`Row ${rowNum}: Missing required fields`);
    }

    // I don't use validateEmailUniqueness because I need the custom error
    if (existingEmailSet.has(row.email)) {
      throw badRequest(
        `Row ${rowNum}: Email ${row.email} is already registered`,
      );
    }

    const classKey = `${row.grade}-${row.major}-${row.section}`;
    const classId = classroomMap.get(classKey);

    const classLabel = getFullClassLabel(
      row.grade as Grade,
      row.major as Major,
      row.section as ClassSection,
    );

    if (!classId)
      throw badRequest(`Row ${rowNum}: Classroom ${classLabel} not found`);
  }

  // Batching for better performance rather than using sequential (One by one)
  const batchSize = 5;

  for (let i = 0; i < data.length; i += batchSize) {
    const batch = data.slice(i, i + batchSize);

    await Promise.all(
      batch.map(async (row) => {
        // Pre-generate IDs
        const studentUserId = createId();
        const parentUserId = createId();

        const hashedStudentPass = await hashing(row.password);
        const rawParentPass = crypto.randomBytes(8).toString("hex");
        const hashedParentPass = await hashing(rawParentPass);

        // Student User
        usersToCreate.push({
          id: studentUserId,
          name: row.username,
          email: row.email,
          password: hashedStudentPass,
          role: "STUDENT" as const,
        });

        const classKey = `${row.grade}-${row.major}-${row.section}`;
        const classId = classroomMap.get(classKey);

        studentProfilesToCreate.push({
          userId: studentUserId,
          classId: classId,
          studentRole: row.studentRole,
        });

        // Parent Logic
        const parentEmail = `${row.username.toLowerCase().replace(/\s/g, "")}.parent@school.com`;

        usersToCreate.push({
          id: parentUserId,
          name: `${row.username}'s Parent`,
          email: parentEmail,
          password: hashedParentPass,
          role: "PARENT" as const,
        });

        parentsToCreate.push({
          userId: parentUserId,
          studentId: studentUserId, // Linking to Student User ID
        });

        parentAccountsForExcel.push({
          studentName: row.username,
          parentEmail,
          parentPassword: rawParentPass,
        });

        // Gradebooks Logic
        const relevantSubjects = allSubjects.filter((subject) => {
          const isGradeAllowed = subject.config.allowedGrades.includes(
            row.grade as any,
          );
          const isMajorAllowed = subject.config.allowedMajors.includes(
            row.major as any,
          );
          return isGradeAllowed && isMajorAllowed;
        });

        for (const subject of relevantSubjects) {
          gradebooksToCreate.push({
            studentId: studentUserId,
            subjectId: subject.id,
            semester,
          });
        }
      }),
    );
  }

  // SEQUENTIAL BULK TRANSACTION
  await prisma.$transaction(
    async (tx: Prisma.TransactionClient) => {
      await tx.user.createMany({ data: usersToCreate });
      await tx.student.createMany({ data: studentProfilesToCreate });
      await tx.parent.createMany({ data: parentsToCreate });
      await tx.gradebook.createMany({ data: gradebooksToCreate });
    },
    { timeout: 40000 },
  );

  // 5. Generate File AFTER Transaction (Non-blocking for DB)
  const parentSheet = XLSX.utils.json_to_sheet(parentAccountsForExcel);
  const parentBook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(parentBook, parentSheet, "Parent Accounts");

  const outBuffer = XLSX.write(parentBook, { type: "array", bookType: "xlsx" });

  return new Response(outBuffer, {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": "attachment; filename=parent-accounts.xlsx",
    },
  });
}
