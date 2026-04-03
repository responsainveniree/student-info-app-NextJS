import { z } from "zod";

const enumError = (name: string) => ({
  errorMap: (issue: z.ZodIssueOptionalMessage, ctx: z.ErrorMapCtx) => {
    return { message: `Please select a valid ${name}` };
  },
});

export const GradeEnum = z.enum(
  ["TENTH", "ELEVENTH", "TWELFTH"],
  enumError("Grade"),
);

export const MajorEnum = z.enum(
  ["ACCOUNTING", "SOFTWARE_ENGINEERING"],
  enumError("Major"),
);

export const StudentRoleEnum = z.enum(
  ["STUDENT", "CLASS_SECRETARY"],
  enumError("Student Role"),
);

export const AttendanceTypesEnum = z.enum(
  ["ALPHA", "SICK", "PERMISSION", "LATE", "PRESENT"],
  enumError("Attendance Type"),
);

export const ClassSectionEnum = z.enum(
  ["none", "1", "2"],
  enumError("Class Section"),
);

export const SortOrderEnum = z.enum(["asc", "desc"], enumError("Sort Order"));

export const DemeritCategoryEnum = z.enum(
  ["DISCIPLINE", "ACADEMIC", "SOCIAL", "OTHER", "LATE", "UNIFORM"],
  enumError("Category"),
);

export const AssessmentType = z.enum(
  ["SCHOOLWORK", "HOMEWORK", "QUIZ", "EXAM", "PROJECT", "GROUP_WORK"],
  enumError("Assessment Type"),
);

export const SubjectTypeEnum = z.enum(
  ["GENERAL", "MAJOR"],
  enumError("Subject Type"),
);

export const page = z
  .string()
  .default("0")
  .transform((val) => Number(val))
  .refine((val) => Number.isInteger(val) && val >= 0, {
    message: "page must be a non-negative integer",
  });

// Schema for subject
export const subjectConfig = z.object({
  allowedGrades: z.array(GradeEnum).min(1, "At least one grade required"),
  allowedMajors: z.array(MajorEnum).min(1, "At least one major required"),
  type: SubjectTypeEnum,
});

export const passwordSchema = z
  .object({
    password: z.string().min(8, { message: "Must be 8 characters at minimum" }),
    confirmPassword: z
      .string()
      .min(8, { message: "Must be 8 characters at minimum" }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
  });

export const classSchema = z.object({
  grade: GradeEnum,
  major: MajorEnum,
  section: ClassSectionEnum,
});

export const teachingAssignmentInput = z.object({
  subjectId: z.number({ message: "Must be filled" }),
  subjectName: z.string({ message: "Must be filled" }),
  grade: GradeEnum,
  major: MajorEnum,
  section: ClassSectionEnum,
});

export type TeachingAssignmentInput = z.infer<typeof teachingAssignmentInput>;
