import { z } from "zod";

export const GradeEnum = z.enum(["TENTH", "ELEVENTH", "TWELFTH"]);
export const MajorEnum = z.enum(["ACCOUNTING", "SOFTWARE_ENGINEERING"]);
export const StudentRoleEnum = z.enum(["STUDENT", "CLASS_SECRETARY"]);
export const AttendanceTypesEnum = z.enum([
  "ALPHA",
  "SICK",
  "PERMISSION",
  "LATE",
  "PRESENT",
]);
export const ClassSectionEnum = z.enum(["none", "1", "2"]);
export const SortByEnum = z.enum(["name", "status"]);
export const SortOrderEnum = z.enum(["asc", "desc"]);
export const DemeritCategoryEnum = z.enum([
  "DISCIPLINE",
  "ACADEMIC",
  "SOCIAL",
  "OTHER",
  "LATE",
  "UNIFORM",
]);
export const AssessmentType = z.enum([
  "SCHOOLWORK",
  "HOMEWORK",
  "QUIZ",
  "EXAM",
  "PROJECT",
  "GROUP_WORK",
]);
export const SubjectTypeEnum = z.enum(["GENERAL", "MAJOR"]);

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
