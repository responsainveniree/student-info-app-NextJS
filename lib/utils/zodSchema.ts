import { z } from "zod";

const GradeEnum = z.enum(["tenth", "eleventh", "twelfth"]);
const MajorEnum = z.enum(["accounting", "softwareEngineering"]);

const zodForgotPassword = z.object({
  email: z.string().email({ message: "Please input a correct format" }),
});

// Schema for frontend data (what we send from CreateTeacherAccount)
const TeachingAssignmentInput = z.object({
  subjectName: z.string(),
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

type StudentSignUpInput = z.infer<typeof zodStudentSignUp>;
type TeacherSignUpInput = z.infer<typeof zodTeacherSignUp>;
type EmailSchema = z.infer<typeof zodForgotPassword>;

export {
  zodStudentSignUp,
  zodTeacherSignUp,
  zodForgotPassword,
  type StudentSignUpInput,
  type TeacherSignUpInput,
  type EmailSchema,
};
