import { z } from "zod";

const GradeEnum = z.enum(["TENTH", "ELEVENTH", "TWELFTH"]);
const MajorEnum = z.enum(["ACCOUNTING", "SOFTWARE_ENGINEERING"]);
const StudentRoleEnum = z.enum(["STUDENT", "CLASS_SECRETARY"]);
const AttendanceTypesEnum = z.enum(["ALPHA", "SICK", "PERMISSIONEnum"]);
const ClassNumberEnum = z.enum(["none", "1", "2"]);
const ProblemPointCategoryEnum = z.enum([
  "DISCIPLINE",
  "ACADEMIC",
  "SOCIAL",
  "OTHER",
  "LATE",
  "INCOMPLETE_ATTRIBUTES",
]);

// Schema for frontend data (what we send from CreateTeacherAccount)
const TeachingAssignmentInput = z.object({
  subjectName: z.string({ message: "Must be filled" }),
  grade: GradeEnum,
  major: MajorEnum,
  classNumber: ClassNumberEnum,
});

const ClassInfoSchema = z.object({
  grade: GradeEnum,
  major: MajorEnum,
  classNumber: ClassNumberEnum,
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
  classNumber: ClassNumberEnum,
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
  token: z.string({ message: "Must be filled" }),
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
const bulkAttendance = z.object({
  secretaryId: z.string({ message: "Must be filled" }),
  date: z.string({ message: "Must be filled" }),
  records: z.array(z.object({
    studentId: z.string({ message: "Must be filled" }),
    attendanceType: AttendanceTypesEnum,
    description: z.string().max(300).optional(),
  }))
})

type BulkAttendanceSchema = z.infer<typeof bulkAttendance>;

// HOMEROOM CLASS STUDENT
const homeroomClassStudent = z.object({
  teacherId: z.string({ message: "Must be filled" }),
  date: z.date({ message: "Must be filled" }),
});

type homeroomClassStudentSchema = z.infer<typeof homeroomClassStudent>;

// PROBLEM POINT
const problemPoint = z.object({
  teacherId: z.string({ message: "Must be filled" }),
  studentsId: z.array(z.string()).min(1),
  problemPointCategory: ProblemPointCategoryEnum,
  point: z
    .number({ message: "Must be filled" })
    .min(5, { message: "The minimum is 5" }),
  description: z.string().max(300),
  date: z.string(),
});

type problemPointSchema = z.infer<typeof problemPoint>;

export {
  zodStudentSignUp,
  zodTeacherSignUp,
  zodForgotPassword,
  zodResetPassword,
  homeroomClassStudent,
  problemPoint,
  bulkAttendance,
  type StudentSignUpInput,
  type TeacherSignUpInput,
  type EmailSchema,
  type ResetPasswordSchema,
  type homeroomClassStudentSchema,
  type problemPointSchema,
  type BulkAttendanceSchema,
};
