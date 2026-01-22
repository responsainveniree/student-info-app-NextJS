import { z } from "zod";

const GradeEnum = z.enum(["TENTH", "ELEVENTH", "TWELFTH"]);
const MajorEnum = z.enum(["ACCOUNTING", "SOFTWARE_ENGINEERING"]);
const StudentRoleEnum = z.enum(["STUDENT", "CLASS_SECRETARY"]);
const AttendanceTypesEnum = z.enum(["ALPHA", "SICK", "PERMISSION", "LATE"]);
const ClassNumberEnum = z.enum(["none", "1", "2"]);
const SortByEnum = z.enum(["name", "status"]);
const SortOrderEnum = z.enum(["asc", "desc"]);
const ProblemPointCategoryEnum = z.enum([
  "DISCIPLINE",
  "ACADEMIC",
  "SOCIAL",
  "OTHER",
  "LATE",
  "INCOMPLETE_ATTRIBUTES",
]);
const AssessmentType = z.enum([
  "SCHOOLWORK",
  "HOMEWORK",
  "QUIZ",
  "EXAM",
  "PROJECT",
  "GROUP",
]);

const classParams = z.object({
  grade: GradeEnum,
  major: MajorEnum,
  classNumber: ClassNumberEnum,
});

type ClassParamsSchema = z.infer<typeof classParams>;

const page = z
  .string()
  .default("0")
  .transform((val) => Number(val))
  .refine((val) => Number.isInteger(val) && val >= 0, {
    message: "page must be a non-negative integer",
  });

// Schema for frontend data (what we send from CreateTeacherAccount)
const TeachingAssignmentInput = z.object({
  subjectName: z.string({ message: "Must be filled" }),
  grade: GradeEnum,
  major: MajorEnum,
  classNumber: ClassNumberEnum,
});

const classSchema = z.object({
  grade: GradeEnum,
  major: MajorEnum,
  classNumber: ClassNumberEnum,
});

const passwordSchema = z
  .object({
    password: z.string().min(8, { message: "Must be 8 characters at minimum" }),
    confirmPassword: z
      .string()
      .min(8, { message: "Must be 8 characters at minimum" }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
  });

// Main schemas
// AUTH
const studentSignUpSchema = z.object({
  creatorId: z.string({ message: "Must be 3 characters at minimum" }),
  username: z.string().min(3, { message: "Must be 3 characters at minimum" }),
  email: z.string().email({ message: "Please input a correct format" }),
  passwordSchema,
  classSchema,
  role: StudentRoleEnum,
});

const zodTeacherSignUp = z.object({
  username: z.string().min(3, { message: "Must be 3 characters at minimum" }),
  email: z.string().email({ message: "Please input a correct format" }),
  password: z.string().min(8, { message: "Must be 8 characters at minimum" }),
  confirmPassword: z
    .string()
    .min(8, { message: "Must be 8 characters at minimum" }),

  homeroomClass: classSchema.optional(),

  teachingAssignment: z.array(TeachingAssignmentInput).optional(),

  teachingClasses: z.array(classSchema).optional(),
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

type StudentSignUpSchema = z.infer<typeof studentSignUpSchema>;
type TeacherSignUpInput = z.infer<typeof zodTeacherSignUp>;
type EmailSchema = z.infer<typeof zodForgotPassword>;
type ResetPasswordSchema = z.infer<typeof zodResetPassword>;

// ATTENDANCE
const bulkAttendance = z.object({
  recorderId: z.string({ message: "Must be filled" }),
  date: z.string({ message: "Must be filled" }),
  records: z.array(
    z.object({
      studentId: z.string({ message: "Must be filled" }),
      attendanceType: AttendanceTypesEnum,
      description: z.string().max(300).optional(),
    }),
  ),
});

type BulkAttendanceSchema = z.infer<typeof bulkAttendance>;

const studentAttendacesQueries = z.object({
  id: z.string({ message: "Must be filled" }),
  date: z
    .string({ message: "Must be filled" })
    .default(new Date().toISOString().split("T")[0]),
  homeroomTeacherId: z.string().optional(),
  page,
  sortBy: SortByEnum,
  sortOrder: SortOrderEnum,
  searchQuery: z.string().optional(),
});

type StudentAttendacesQueriesSchema = z.infer<typeof studentAttendacesQueries>;

const attendanceSummaryQueries = z.object({
  id: z.string({ message: "Must be filled" }),
  page,
  sortOrder: SortOrderEnum,
  searchQuery: z.string().optional(),
});

type AttendanceSummaryQueriesSchema = z.infer<typeof attendanceSummaryQueries>;

// HOMEROOM CLASS STUDENT
const homeroomClassStudent = z.object({
  teacherId: z.string({ message: "Must be filled" }),
  date: z.date({ message: "Must be filled" }),
});

type HomeroomClassStudentSchema = z.infer<typeof homeroomClassStudent>;

// PROBLEM POINT
const problemPointQuerySchema = z.object({
  grade: GradeEnum,
  major: MajorEnum,
  classNumber: ClassNumberEnum,
  recordedBy: z.string({ message: "Must be filled" }),
});

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

type ProblemPointSchema = z.infer<typeof problemPoint>;

const updateProblemPoint = z.object({
  problemPointId: z.number(),
  teacherId: z.string({ message: "Must be filled" }),
  problemPointCategory: ProblemPointCategoryEnum,
  point: z
    .number({ message: "Must be filled" })
    .min(5, { message: "The minimum is 5" }),
  description: z.string().max(300),
  date: z.string(),
});

type UpadateProblemPointSchema = z.infer<typeof problemPoint>;

// SCORING SYSTEM (TEACHER)
const queryStudentMarks = z.object({
  studentId: z.string().min(1),
  subjectName: z.string().min(1).optional(),
  isMarkPage: z
    .enum(["true", "false"])
    .optional()
    .transform((val) => val === "true"),
  page,
});

type QueryStudentMarksSchema = z.infer<typeof queryStudentMarks>;

const DescriptionSchema = z.object({
  givenAt: z.string({ message: "Must be filled" }),
  dueAt: z.string({ message: "Must be filled" }),
  detail: z.string({ message: "Must be filled" }),
});

const markColumn = z.object({
  teacherId: z.string({ message: "Must be filled" }),
  class: classSchema,
  subjectId: z.number({ message: "Must be filled" }),
  subjectName: z.string({ message: "Must be filled" }),
  assessmentType: AssessmentType,
  description: DescriptionSchema,
});

type MarkColumnSchema = z.infer<typeof markColumn>;

const studentAssessments = z.object({
  assessmentNumber: z.number({ message: "Must be number and filled" }),
  score: z.number({ message: "Must be number and filled" }).nullable(),
});

const studentMarkData = z.object({
  studentId: z.string({ message: "Must be filled" }),
  subjectName: z.string({ message: "Must be filled" }),
  studentAssessments: z
    .array(studentAssessments)
    .nonempty("Student assessments can't be empty"),
});

const markRecords = z.object({
  teacherId: z.string({ message: "Must be filled" }), // for validation
  students: z.array(studentMarkData).nonempty("student data can't be empty"),
});

type MarkRecordSchema = z.infer<typeof markRecords>;

export {
  classParams,
  studentSignUpSchema,
  zodTeacherSignUp,
  zodForgotPassword,
  zodResetPassword,
  homeroomClassStudent,
  problemPoint,
  bulkAttendance,
  studentAttendacesQueries,
  attendanceSummaryQueries,
  queryStudentMarks,
  markColumn,
  markRecords,
  updateProblemPoint,
  problemPointQuerySchema,
  type ClassParamsSchema,
  type StudentSignUpSchema,
  type TeacherSignUpInput,
  type EmailSchema,
  type ResetPasswordSchema,
  type HomeroomClassStudentSchema,
  type ProblemPointSchema,
  type BulkAttendanceSchema,
  type QueryStudentMarksSchema,
  type AttendanceSummaryQueriesSchema,
  type StudentAttendacesQueriesSchema,
  type MarkColumnSchema,
  type MarkRecordSchema,
  type UpadateProblemPointSchema,
};
