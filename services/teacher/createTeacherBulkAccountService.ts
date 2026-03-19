import { prisma } from "@/db/prisma";
import {
  ClassSection,
  Grade,
  GRADES,
  Major,
  MAJORS,
} from "@/lib/constants/class";
import { badRequest } from "@/lib/errors";
import hashing from "@/lib/utils/hashing";
import { Prisma } from "@prisma/client";
import * as XLSX from "xlsx";
import { createId } from "@paralleldrive/cuid2";
import { getFullClassLabel } from "@/lib/utils/labels";

type TeacherAccountExcel = {
  name: string;
  email: string;
  password: string;
  homeroomGrade?: Grade;
  homeroomMajor?: Major;
  homeroomClassSection?: ClassSection;
  teachingAssignments?: string; // Comma-separated: "math:tenth:accounting:1,english:eleventh:softwareEngineering:2"
};

export async function createTeacherBulkAccountService(file: File) {
  // Read Excel file
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer);
  const worksheet = workbook.Sheets[workbook.SheetNames[0]];
  const data = XLSX.utils.sheet_to_json(worksheet) as TeacherAccountExcel[];

  if (data.length === 0) {
    throw badRequest("Excel file is empty");
  }

  // PRE-FETCH DATA FOR VALIDATION
  const excelEmails = data.map((row) => row.email).filter(Boolean);
  const [existingUsers, allClassrooms, allSubjects] = await Promise.all([
    prisma.user.findMany({
      where: { email: { in: excelEmails }, role: "STAFF" },
      select: { email: true },
    }),
    prisma.classroom.findMany(),
    prisma.subject.findMany({
      select: { id: true, name: true, config: true },
    }),
  ]);
  const existingEmailSet = new Set(
    existingUsers.map((u: { email: string }) => u.email),
  );
  const classroomMap = new Map(
    allClassrooms.map(
      (c) =>
        [
          `${c.grade}-${c.major}-${c.section}`,
          { id: c.id, homeroomTeacherId: c.homeroomTeacherId },
        ] as const,
    ),
  );
  const subjectMap = new Map(
    allSubjects.map(
      (s) => [s.name, { subjectId: s.id, config: s.config }] as const,
    ),
  );

  // PREPARE COLLECTIONS
  const usersToCreate: Prisma.UserCreateManyInput[] = [];
  const teacherProfilesToCreate: Prisma.TeacherCreateManyInput[] = [];
  const teachingAssignmentsToCreate: Prisma.TeachingAssignmentCreateManyInput[] =
    [];
  const classroomsToUpdate: {
    where: { id: number };
    data: { homeroomTeacherId: string };
  }[] = [];

  // VALIDATION
  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    const rowNumber = i + 2;
    // Validate required fields
    if (!row.name || !row.email || !row.password) {
      throw badRequest(`Row ${rowNumber}: Missing required fields`);
    }

    // Validate grade and major
    if (row.homeroomGrade) {
      if (!GRADES.includes(row.homeroomGrade as Grade)) {
        throw badRequest(`Row ${rowNumber}: Invalid grade format in homeroom.`);
      }
    }

    if (row.homeroomMajor) {
      if (!MAJORS.includes(row.homeroomMajor as Major)) {
        throw badRequest(`Row ${rowNumber}: Invalid major format in homeroom.`);
      }
    }

    // Check if teacher already exists
    if (existingEmailSet.has(row.email)) {
      throw badRequest(`Row ${rowNumber}:Email already registered`);
    }

    // Handle Homeroom Class
    if (row.homeroomGrade && row.homeroomMajor && row.homeroomClassSection) {
      const existingClassroom = classroomMap.get(
        `${row.homeroomGrade}-${row.homeroomMajor}-${row.homeroomClassSection}`,
      );

      const classLabel = getFullClassLabel(
        row.homeroomGrade,
        row.homeroomMajor,
        row.homeroomClassSection,
      );

      if (!existingClassroom) {
        throw badRequest(`Row ${rowNumber}: ${classLabel} not found`);
      }

      const { homeroomTeacherId } = existingClassroom;

      if (homeroomTeacherId) {
        throw badRequest(
          `Row ${rowNumber}: ${classLabel} already has a homeroom teacher`,
        );
      }
    }

    if (row.teachingAssignments && row.teachingAssignments?.length > 0) {
      const transformTeachingAssignments = row.teachingAssignments
        .split(",")
        .map((s) => s.trim());

      const teachingAssignmentUniqueKey = new Set();

      // ta = teaching assignemnt
      // Validate: Check for duplicate assignments (same subject in same class)
      transformTeachingAssignments.forEach((ta) => {
        const [subjectName, grade, major, section] = ta.split(":");
        const key = `${subjectName}-${grade}-${major}-${section}`;

        if (teachingAssignmentUniqueKey.has(key)) {
          const classLabel = getFullClassLabel(
            grade as Grade,
            major as Major,
            section as ClassSection,
          );
          throw badRequest(
            `Duplicate assignment detected! You cannot teach "${subjectName}" more than once in ${classLabel}.`,
          );
        }

        teachingAssignmentUniqueKey.add(key);
      });

      transformTeachingAssignments.forEach((ta) => {
        const [subjectName, grade, major, section] = ta.split(":");

        if (grade) {
          if (!GRADES.includes(grade as Grade)) {
            throw badRequest(
              `Row ${rowNumber}: Invalid grade format in teaching classes.`,
            );
          }
        }

        if (major) {
          if (!MAJORS.includes(major as Major)) {
            throw badRequest(
              `Row ${rowNumber}: Invalid major format in teaching classes.`,
            );
          }
        }

        const classroom = classroomMap.get(
          `${grade as Grade}-${major as Major}-${section as ClassSection}`,
        );

        const classLabel = getFullClassLabel(
          grade as Grade,
          major as Major,
          section as ClassSection,
        );

        if (!classroom) {
          throw badRequest(`Row ${i + 1}: ${classLabel} not found`);
        }

        // From DB
        const subjectMapData = subjectMap.get(subjectName);

        if (!subjectMapData) {
          throw badRequest(
            `Subject ${subjectName} not found. Please check your subject data.`,
          );
        }

        const { config } = subjectMapData;

        const isGradeInclude = config.allowedGrades.includes(grade as Grade);

        const isMajorInclude = config.allowedMajors.includes(major as Major);

        if (!(isGradeInclude && isMajorInclude)) {
          throw badRequest(`${subjectName}: Config miss match`);
        }
      });
    }
  }

  // Batching
  const batchSize = 5;

  for (let i = 0; i < data.length; i += batchSize) {
    const rowNumber = i + 2;
    const batch = data.slice(i, i + batchSize);

    await Promise.all(
      batch.map(async (row) => {
        const teacherUserId = createId();

        const hashedPassword = await hashing(row.password);

        usersToCreate.push({
          id: teacherUserId,
          name: row.name,
          email: row.email,
          password: hashedPassword,
          role: "STAFF",
        });

        teacherProfilesToCreate.push({
          userId: teacherUserId,
          staffRole: "TEACHER",
        });

        // Handle Homeroom Class
        if (
          row.homeroomGrade &&
          row.homeroomMajor &&
          row.homeroomClassSection
        ) {
          const existingClassroom = classroomMap.get(
            `${row.homeroomGrade}-${row.homeroomMajor}-${row.homeroomClassSection}`,
          );

          const classLabel = getFullClassLabel(
            row.homeroomGrade,
            row.homeroomMajor,
            row.homeroomClassSection,
          );

          // Only for avoiding TS compiler error
          if (!existingClassroom) {
            throw badRequest(`Row ${rowNumber}: ${classLabel} not found`);
          }

          const { id } = existingClassroom;

          classroomsToUpdate.push({
            where: {
              id: id,
            },
            data: {
              homeroomTeacherId: teacherUserId,
            },
          });
        }

        if (row.teachingAssignments && row.teachingAssignments?.length > 0) {
          const transformTeachingAssignments = row.teachingAssignments
            .split(",")
            .map((s) => s.trim());

          transformTeachingAssignments.forEach((ta) => {
            const [subjectName, grade, major, section] = ta.split(":");

            const classroom = classroomMap.get(
              `${grade as Grade}-${major as Major}-${section as ClassSection}`,
            );

            const classLabel = getFullClassLabel(
              grade as Grade,
              major as Major,
              section as ClassSection,
            );

            // Only for avoiding TS compiler error
            if (!classroom) {
              throw badRequest(`Row ${i + 1}: ${classLabel} not found`);
            }

            const { id } = classroom;

            // From DB
            const subjectMapData = subjectMap.get(subjectName);

            if (!subjectMapData) {
              throw badRequest(
                `Subject ${subjectName} not found. Please check your subject data.`,
              );
            }

            const { subjectId } = subjectMapData;

            teachingAssignmentsToCreate.push({
              subjectId: subjectId,
              teacherId: teacherUserId,
              classId: id,
            });
          });
        }
      }),
    );
  }

  // Process each teacher
  await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    await tx.user.createMany({ data: usersToCreate });
    await tx.teacher.createMany({ data: teacherProfilesToCreate });
    if (classroomsToUpdate.length > 0) {
      await Promise.all(
        classroomsToUpdate.map((item) =>
          tx.classroom.update({
            where: item.where,
            data: item.data,
          }),
        ),
      );
    }
    await tx.teachingAssignment.createMany({
      data: teachingAssignmentsToCreate,
    });
  });

  return Response.json(
    {
      message: `Teacher accounts successfully created.`,
    },
    { status: 201 },
  );
}
