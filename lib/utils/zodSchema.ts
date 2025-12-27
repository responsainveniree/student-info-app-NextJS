import { z } from "zod";

const GradeEnum = z.enum(["TENTH", "ELEVENTH", "TWELFTH"]);
const MajorEnum = z.enum(["ACCOUNTING", "SOFTWARE_ENGINEERING"]);
const StudentRoleEnum = z.enum(["STUDENT", "CLASS_SECRETARY"]);
const AttendanceTypesEnum = z.enum(["ALPHA", "SICK", "PERMISSION"]);

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
// AUTH
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

// ATTENDANCE
const zodStudentAttandance = z.object({
  secretaryId: z.string({ message: "Must be filled" }),
  studentId: z.string({ message: "Must be filled" }),
  date: z.string({ message: "Must be filled" }),
  attendanceType: AttendanceTypesEnum,
  description: z.string().max(300).optional(),
});

type StudentAttendanceSchema = z.infer<typeof zodStudentAttandance>;

export {
  zodStudentSignUp,
  zodTeacherSignUp,
  zodForgotPassword,
  zodResetPassword,
  zodStudentAttandance,
  type StudentSignUpInput,
  type TeacherSignUpInput,
  type EmailSchema,
  type ResetPasswordSchema,
  type StudentAttendanceSchema,
};
