import { prisma } from "@/db/prisma";
import { validateEmailUniqueness } from "@/domain/account/emailRules";
import { ensureClassroomExists } from "@/domain/classroom/classroomRules";
import { badRequest } from "@/lib/errors";
import hashing from "@/lib/utils/hashing";
import { getFullClassLabel } from "@/lib/utils/labels";
import { validateTeachingStructure } from "@/lib/validation/teachingValidators";
import { TeacherSignUpSchema } from "@/lib/zod/teacher";
import { findClassroom } from "@/repositories/classroomRepository";
import { findSubjects } from "@/repositories/subjectRepository";
import { findUserByEmail } from "@/repositories/userRepository";

type ResolvedTeachingAssignments = {
  teacherId: string;
  subjectId: number;
  classId: number;
};

export async function createTeacherAccountService(data: TeacherSignUpSchema) {
  return prisma.$transaction(async (tx) => {
    const user = findUserByEmail(data.email, tx);

    validateEmailUniqueness(user);

    const subjects = await findSubjects();

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
          const classroom = await findClassroom(
            assignment.grade,
            assignment.major,
            assignment.section,
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
            classId: classroom.id,
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
      const classroom = await findClassroom(
        data.homeroomClass.grade,
        data.homeroomClass.major,
        data.homeroomClass.section,
        tx,
      );

      ensureClassroomExists(classroom);

      if (classroom.teacherId) {
        if (classroom.homeroomTeacherId) {
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
            id: classroom.id,
          },
          data: {
            homeroomTeacherId: teacher.id,
          },
        });
      }
    }
  });
}
