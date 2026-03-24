import { z } from "zod";

const GradeEnum = z.enum(["TENTH", "ELEVENTH", "TWELFTH"]);
const MajorEnum = z.enum(["ACCOUNTING", "SOFTWARE_ENGINEERING"]);
const StudentRoleEnum = z.enum(["STUDENT", "CLASS_SECRETARY"]);
const ClassSectionEnum = z.enum(["none", "1", "2"]);

const page = z
  .string()
  .default("0")
  .transform((val) => Number(val))
  .refine((val) => Number.isInteger(val) && val >= 0, {
    message: "page must be a non-negative integer",
  });

const classSchema = z.object({
  grade: GradeEnum,
  major: MajorEnum,
  section: ClassSectionEnum,
});

type ClassSchema = z.infer<typeof classSchema>;

// Student
const studentQuerySchema = z.object({
  grade: GradeEnum.optional(),
  major: MajorEnum.optional(),
  section: ClassSectionEnum.optional(),
  page,
  search: z.string().optional(),
  isPaginationActive: z
    .string()
    .default("true")
    .transform((v) => Boolean(v)),
});

// HOMEROOM CLASS STUDENT
const homeroomClassStudent = z.object({
  teacherId: z.string({ message: "Must be filled" }),
  date: z.date({ message: "Must be filled" }),
});

type HomeroomClassStudentSchema = z.infer<typeof homeroomClassStudent>;

// Edit User (Staff Feature)
// Student
const updateStudentProfileSchema = z.object({
  id: z.string({ message: "Id field must be filled" }),
  name: z.string({ message: "Name field must be filled" }),
  role: StudentRoleEnum,
  classSchema,
});

type UpdateStudentProfileSchema = z.infer<typeof updateStudentProfileSchema>;

export const updateStudentsClassSchema = z.object({
  updatedClassId: z.number({
    required_error: "Class ID is required",
    invalid_type_error: "Class ID must be a number",
  }),

  studentIds: z
    .array(z.string().min(1))
    .min(1, { message: "At least one student must be provided." }),
});

export {
  studentQuerySchema,
  homeroomClassStudent,
  classSchema,
  updateStudentProfileSchema,
  type ClassSchema,
  type HomeroomClassStudentSchema,
  type UpdateStudentProfileSchema,
};
