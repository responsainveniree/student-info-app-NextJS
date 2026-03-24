import { prisma } from "@/db/prisma";
import { validateEmailUniqueness } from "@/domain/account/emailRules";
import { ensureClassroomExists } from "@/domain/classroom/classroom-rules";
import { badRequest } from "@/lib/errors";
import hashing from "@/lib/utils/hashing";
import { getFullClassLabel } from "@/lib/utils/labels";
import { validateTeachingStructure } from "@/lib/validation/teachingValidators";
import { TeacherSignUpSchema } from "@/lib/zod/teacher";
import { findUniqueClassroom } from "@/repositories/classroom-repository";
import { findSubjects } from "@/repositories/subject-repository";
import { findUserByEmail } from "@/repositories/user-repository";
import { Prisma } from "@prisma/client";

type ResolvedTeachingAssignments = {
  teacherId: string;
  subjectId: number;
  classId: number;
};

export async function createTeacherAccount(data: TeacherSignUpSchema) {
  return prisma.$transaction(async (tx) => {
    const user = await findUserByEmail(data.email, tx);

    validateEmailUniqueness(user);

    const selectSubjectWithConfig = Prisma.validator<Prisma.SubjectSelect>()({
      id: true,
      name: true,
      type: true,
      configId: true,
      config: true,
    });

    const subjects = await findSubjects(
      prisma,
      {},
      selectSubjectWithConfig,
      true,
    );

    const hashedPassword = await hashing(data.passwordSchema.password);

    const teacher = await tx.user.create({
      data: {
        role: "STAFF",
        name: data.username,
        email: data.email,
        password: hashedPassword,

        teacherProfile: {
          create: {
            staffRole: "TEACHER",
          },
        },
      },
      select: {
        name: true,
        email: true,
        id: true,
      },
    });

    let resolvedTeachingAssignments: ResolvedTeachingAssignments[] = [];

    if (Array.isArray(data.assignments) && data.assignments.length > 0) {
      /* VALIDATION: 
            - Check for duplicate assignments (same subject in same class)
        */
      validateTeachingStructure(data.assignments);

      // Resolve classroom IDs and validate existence for each assignment
      resolvedTeachingAssignments = await Promise.all(
        data.assignments.map(async (assignment) => {
          const classroomByUniqueIdentifier =
            Prisma.validator<Prisma.ClassroomWhereUniqueInput>()({
              grade_major_section: {
                grade: assignment.grade,
                major: assignment.major,
                section: assignment.section,
              },
            });

          const classroom = await findUniqueClassroom(
            classroomByUniqueIdentifier,
            undefined,
            tx,
          );

          ensureClassroomExists(classroom);

          if (!subjects) {
            throw badRequest("Subject was not found");
          }

          const isGradeInclude = subjects
            .find((subject) => subject.id === assignment.subjectId)
            ?.config.allowedGrades.includes(assignment.grade);

          const isMajorInclude = subjects
            .find((subject) => subject.id === assignment.subjectId)
            ?.config.allowedMajors.includes(assignment.major);

          if (!(isGradeInclude && isMajorInclude)) {
            throw badRequest(`${assignment.subjectName}: Config miss match`);
          }

          return {
            teacherId: teacher.id,
            subjectId: assignment.subjectId,
            classId: classroom!.id,
          };
        }),
      );
    }

    if (resolvedTeachingAssignments.length !== 0) {
      await tx.teachingAssignment.createMany({
        data: resolvedTeachingAssignments,
        skipDuplicates: true,
      });
    }

    if (data.homeroomClass?.grade && data.homeroomClass.major) {
      const classroomByUniqueIdentifier =
        Prisma.validator<Prisma.ClassroomWhereUniqueInput>()({
          grade_major_section: {
            grade: data.homeroomClass.grade,
            major: data.homeroomClass.major,
            section: data.homeroomClass.section,
          },
        });

      const classroom = await findUniqueClassroom(
        classroomByUniqueIdentifier,
        undefined,
        tx,
      );

      ensureClassroomExists(classroom);

      if (classroom!.homeroomTeacherId) {
        const classLabel = getFullClassLabel(
          data.homeroomClass.grade,
          data.homeroomClass.major,
          data.homeroomClass.section,
        );

        throw badRequest(
          `${classLabel} already has a homeroom teacher assigned. `,
        );
      }

      await tx.classroom.update({
        where: {
          id: classroom!.id,
        },
        data: {
          homeroomTeacherId: teacher.id,
        },
      });
    }
  });
}
