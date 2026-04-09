import { z } from "zod";
import {
  classSchema,
  ClassSectionEnum,
  GradeEnum,
  MajorEnum,
  page,
  passwordSchema,
  StudentRoleEnum,
} from "./general";

export const studentQuerySchema = z.object({
  grade: GradeEnum.optional(),
  major: MajorEnum.optional(),
  section: ClassSectionEnum.optional(),
  page,
  search: z.string().optional(),
  isPaginationActive: z.union([z.boolean(), z.string()]).transform((v) => {
    if (typeof v === "boolean") return v;
    return v === "true";
  }),
});

export type StudentQuerySchema = z.infer<typeof studentQuerySchema>;

export const studentSignUpSchema = z.object({
  username: z.string().min(3, { message: "Must be 3 characters at minimum" }),
  email: z.string().email({ message: "Please input a correct format" }),
  passwordSchema,
  classSchema,
  studentRole: StudentRoleEnum,
});

export type StudentSignUpSchema = z.infer<typeof studentSignUpSchema>;

export const getStudentExportSchema = z.object({
  grade: GradeEnum,
  major: MajorEnum,
  section: ClassSectionEnum,
});

export type GetStudentExportSchema = z.infer<typeof getStudentExportSchema>;

export const updateStudentProfileSchema = z.object({
  id: z.string({ message: "Id field must be filled" }),
  name: z
    .string({ message: "Name field must be filled" })
    .min(3, { message: "Name field must have 3 characters at least" }),
  email: z.string({ message: "Email field must be filled" }),
  passwordSchema: passwordSchema.optional(),
  role: StudentRoleEnum,
  classSchema,
});

export type UpdateStudentProfileSchema = z.infer<
  typeof updateStudentProfileSchema
>;

export const updateStudentsClassSchema = z.object({
  updatedClassId: z.string({
    required_error: "Class ID is required",
    invalid_type_error: "Class ID must be a string",
  }),

  studentIds: z
    .array(z.string().min(1))
    .min(1, { message: "At least one student must be provided." }),
});

export type UpdateStudentsClassSchema = z.infer<
  typeof updateStudentsClassSchema
>;
