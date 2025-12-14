import { z } from "zod";

const GradeEnum = z.enum(["tenth", "eleventh", "twelfth"]);
const MajorEnum = z.enum(["accounting", "softwareEngineering"]);

// Schema for frontend data (what we send from CreateTeacherAccount)
const TeachingAssignmentInput = z.object({
  subjectName: z.string(),
  grade: GradeEnum,
  major: MajorEnum,
  classNumber: z.string().optional(),
});

const ClassInfoSchema = z.object({
  grade: GradeEnum,
  major: MajorEnum,
  classNumber: z.string().optional(),
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
  classNumber: z.string().optional(),
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

type zodStudentSignUpSchema = z.infer<typeof zodStudentSignUp>;
type zodTeacherSignUpSchema = z.infer<typeof zodTeacherSignUp>;

export {
  zodStudentSignUp,
  zodTeacherSignUp,
  type zodStudentSignUpSchema,
  type zodTeacherSignUpSchema,
};
