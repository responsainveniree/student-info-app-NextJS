import { string, z } from "zod";

const GradeEnum = z.enum(["tenth", "eleventh", "twelfth"]);
const MajorEnum = z.enum(["accounting", "softwareEngineering"]);
const StudentRoleEnum = z.enum(["student", "classSecretary"]);

// Schema for frontend data (what we send from CreateTeacherAccount)
const TeachingAssignmentInput = z.object({
  subjectName: z.string({ message: "Must be filled" }),
  grade: GradeEnum,
  major: MajorEnum,
  classNumber: z.string({ message: "Must be filled" }),
});

const ClassInfoSchema = z.object({
  grade: GradeEnum,
  major: MajorEnum,
  classNumber: z.string({ message: "Must be filled" }),
});

// Main schemas
const zodStudentSignUp = z.object({
  username: z.string().min(3, { message: "Must be 3 characters at minimum" }),
  email: z.string().email({ message: "Please input a correct format" }),
  password: z.string().min(8, { message: "Must be 8 characters at minimum" }),
  confirmPassword: z
    .string()
    .min(8, { message: "Must be 8 characters at minimum" }),

  grade: GradeEnum,
  major: MajorEnum,
  classNumber: z.string({ message: "Must be filled" }),
  role: StudentRoleEnum,
});

const zodTeacherSignUp = z.object({
  username: z.string().min(3, { message: "Must be 3 characters at minimum" }),
  email: z.string().email({ message: "Please input a correct format" }),
  password: z.string().min(8, { message: "Must be 8 characters at minimum" }),
  confirmPassword: z
    .string()
    .min(8, { message: "Must be 8 characters at minimum" }),

  homeroomClass: ClassInfoSchema.optional(),

  teachingAssignment: z.array(TeachingAssignmentInput).optional(),

  teachingClasses: z.array(ClassInfoSchema).optional(),
});

const zodForgotPassword = z.object({
  email: z.string().email({ message: "Please input a correct format" }),
});

const zodResetPassword = z.object({
  otp: z.string({ message: "Must be filled" }),
  password: z
    .string({ message: "Must be filled" })
    .min(8, { message: "Must be 8 characters at minimum" }),
  confirmPassword: z
    .string({ message: "Must be filled" })
    .min(8, { message: "Must be 8 characters at minimum" }),
});

type StudentSignUpInput = z.infer<typeof zodStudentSignUp>;
type TeacherSignUpInput = z.infer<typeof zodTeacherSignUp>;
type EmailSchema = z.infer<typeof zodForgotPassword>;
type ResetPasswordSchema = z.infer<typeof zodResetPassword>;

export {
  zodStudentSignUp,
  zodTeacherSignUp,
  zodForgotPassword,
  zodResetPassword,
  type StudentSignUpInput,
  type TeacherSignUpInput,
  type EmailSchema,
  type ResetPasswordSchema,
};
