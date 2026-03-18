import { z } from "zod";

const GradeEnum = z.enum(["TENTH", "ELEVENTH", "TWELFTH"]);
const MajorEnum = z.enum(["ACCOUNTING", "SOFTWARE_ENGINEERING"]);
const StudentRoleEnum = z.enum(["STUDENT", "CLASS_SECRETARY"]);
const AttendanceTypesEnum = z.enum([
  "ALPHA",
  "SICK",
  "PERMISSION",
  "LATE",
  "PRESENT",
]);
const ClassSectionEnum = z.enum(["none", "1", "2"]);
const SortByEnum = z.enum(["name", "status"]);
const SortOrderEnum = z.enum(["asc", "desc"]);
const DemeritCategoryEnum = z.enum([
  "DISCIPLINE",
  "ACADEMIC",
  "SOCIAL",
  "OTHER",
  "LATE",
  "UNIFORM",
]);
const AssessmentType = z.enum([
  "SCHOOLWORK",
  "HOMEWORK",
  "QUIZ",
  "EXAM",
  "PROJECT",
  "GROUP_WORK",
]);
const SubjectTypeEnum = z.enum(["GENERAL", "MAJOR"]);

const page = z
  .string()
  .default("0")
  .transform((val) => Number(val))
  .refine((val) => Number.isInteger(val) && val >= 0, {
    message: "page must be a non-negative integer",
  });

// Schema for subject
const subjectConfig = z.object({
  allowedGrades: z.array(GradeEnum).min(1, "At least one grade required"),
  allowedMajors: z.array(MajorEnum).min(1, "At least one major required"),
  type: SubjectTypeEnum,
});

const createSubjectSchema = z.object({
  subjectRecords: z
    .array(
      z.object({
        subjectNames: z
          .array(
            z.string().min(3, { message: "At least must be 3 Characters" }),
          )
          .min(1),
        subjectConfig,
      }),
    )
    .min(1),
});

const getSubjectQueriesSchema = z.object({
  page,
  sortOrder: SortOrderEnum,
  subjectName: z
    .string()
    .min(3, { message: "At least must be 3 characters" })
    .optional(),
  grade: GradeEnum.optional(),
  major: MajorEnum.optional(),
  subjectType: SubjectTypeEnum.optional(),
  getAll: z
    .enum(["true", "false"])
    .optional()
    .transform((val) => val === "true"),
});

const patchSubjectSchema = z.object({
  subjectId: z.number(),
  subjectName: z
    .string()
    .min(3, "Must be at least 3 characters long.")
    .optional(),
  subjectConfig: subjectConfig.partial().optional(),
});

type CreateSubjectInput = z.infer<typeof createSubjectSchema>;
type SubjectQueriesSchema = z.infer<typeof getSubjectQueriesSchema>;
type PatchSubjectInput = z.infer<typeof patchSubjectSchema>;

// Schema for frontend data (what we send from CreateTeacherAccount)
const teachingAssignmentInput = z.object({
  subjectId: z.number({ message: "Must be filled" }),
  subjectName: z.string({ message: "Must be filled" }),
  grade: GradeEnum,
  major: MajorEnum,
  section: ClassSectionEnum,
});

type TeachingAssignmentInput = z.infer<typeof teachingAssignmentInput>;

const classSchema = z.object({
  grade: GradeEnum,
  major: MajorEnum,
  section: ClassSectionEnum,
});

type ClassSchema = z.infer<typeof classSchema>;

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

// Classroom
const createClassSchema = z.array(classSchema);

type CreateClassSchema = z.infer<typeof createClassSchema>;

const updateClassSchema = z.object({
  id: z.number(),
  classSchema: classSchema,
  homeroomTeacherId: z.string().optional(),
});

type UpdateClassSchema = z.infer<typeof updateClassSchema>;

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

// AUTH

const forgotPasswordSchema = z.object({
  email: z.string().email({ message: "Please input a correct format" }),
});

const resetPasswordSchema = z.object({
  otp: z.string({ message: "Must be filled" }),
  token: z.string({ message: "Must be filled" }),
  password: z
    .string({ message: "Must be filled" })
    .min(8, { message: "Must be 8 characters at minimum" }),
  confirmPassword: z
    .string({ message: "Must be filled" })
    .min(8, { message: "Must be 8 characters at minimum" }),
});

type ForgotPasswordSchema = z.infer<typeof forgotPasswordSchema>;
type ResetPasswordSchema = z.infer<typeof resetPasswordSchema>;

// ATTENDANCE
const bulkAttendanceSchema = z.object({
  date: z.string({ message: "Must be filled" }),
  records: z.array(
    z.object({
      studentId: z.string({ message: "Must be filled" }),
      attendanceType: AttendanceTypesEnum,
      description: z.string().max(300).optional(),
    }),
  ),
});

type BulkAttendanceSchema = z.infer<typeof bulkAttendanceSchema>;

const studentAttendacesQueries = z.object({
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

// DEMERIT POINT
const demeritPointQuerySchema = z.object({
  grade: GradeEnum,
  major: MajorEnum,
  section: ClassSectionEnum,
});

const createDemeritPointSchema = z.object({
  studentsId: z.array(z.string()).min(1),
  demeritCategory: DemeritCategoryEnum,
  points: z
    .number({ message: "Point field must be filled" })
    .min(5, { message: "Point field must be filled. The minimum points is 5" }),
  description: z.string().max(300),
  date: z.string(),
});

type CreateDemeritPointSchema = z.infer<typeof createDemeritPointSchema>;

const updateDemeritPointSchema = z.object({
  demeritRecordId: z.number(),
  demeritCategory: DemeritCategoryEnum,
  points: z
    .number({ message: "Point field must be filled" })
    .min(5, { message: "Point field must be filled. The minimum points is 5" }),
  description: z.string().max(300),
  date: z.string(),
});

type UpdateDemeritPointSchema = z.infer<typeof updateDemeritPointSchema>;

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

const descriptionSchema = z.object({
  givenAt: z.string({ message: "Given at Must be filled" }),
  dueAt: z.string({ message: "Due at Must be filled" }),
  title: z
    .string({ message: "Title must be filled" })
    .max(20, { message: "Title must not exceed 20 characters" }),
});

// CRUD Assessment Schema
const createStudentAssessmentSchema = z.object({
  class: classSchema,
  subjectId: z.number({ message: "Must be filled" }),
  subjectName: z.string({ message: "Must be filled" }),
  assessmentType: AssessmentType,
  description: descriptionSchema,
});

type CreateStudentAssessmentSchema = z.infer<
  typeof createStudentAssessmentSchema
>;

const getStudentAssessmentSchema = z.object({
  grade: GradeEnum,
  major: MajorEnum,
  section: ClassSectionEnum,
  subjectId: z
    .string()
    .min(1, { message: "Must be filled" })
    .transform((val) => Number(val))
    .refine((val) => !isNaN(val), { message: "Must be a valid number" }),
  page,
});

type GetStudentAssessmentSchema = z.infer<typeof getStudentAssessmentSchema>;

const updateStudentAssessmentSchema = z.object({
  assessmentId: z.number({ message: "Assessment id must be filled" }),
  teachingAssignmentId: z.number({
    message: "Teaching assignment id must be filled",
  }),
  assessmentType: AssessmentType,
  descriptionSchema,
});

type UpdateStudentAssessmentSchema = z.infer<
  typeof updateStudentAssessmentSchema
>;

// Assessment score
const studentAssessmentScore = z.object({
  assessmentScoreId: z.number({
    message: "Assessment score id must be filled",
  }),
  score: z.number({ message: "Must be number and filled" }),
});

const studentMarkData = z.object({
  studentId: z.string({ message: "Studet id field must be filled" }),
  studentAssessments: z
    .array(studentAssessmentScore)
    .nonempty({ message: "Student assessments can't be empty" }),
});

const updateAssessmentScoresSchema = z.object({
  subjectId: z.number({ message: "Subject id field must be filled" }),
  classId: z.number({ message: "Class id field must be filled" }),
  students: z
    .array(studentMarkData)
    .nonempty({ message: "student data can't be empty" }),
});

type UpdateAssessmentScoresSchema = z.infer<
  typeof updateAssessmentScoresSchema
>;

// getStudnetAssessmentScore based on the subject
const getStudnetAssessmentScore = z.object({
  subjectId: z
    .string()
    .min(1)
    .transform((value) => Number(value)),
  page,
});

type GetStudnetAssessmentScore = z.infer<typeof getStudentAssessmentSchema>;

// EXPORT student into excel for easier assessment management
const getStudentExportSchema = z.object({
  grade: GradeEnum,
  major: MajorEnum,
  section: ClassSectionEnum,
});

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
  createClassSchema,
  updateClassSchema,
  createSubjectSchema,
  getSubjectQueriesSchema,
  patchSubjectSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  homeroomClassStudent,
  createDemeritPointSchema,
  bulkAttendanceSchema,
  studentAttendacesQueries,
  attendanceSummaryQueries,
  queryStudentMarks,
  createStudentAssessmentSchema,
  getStudentAssessmentSchema,
  updateStudentAssessmentSchema,
  updateAssessmentScoresSchema,
  getStudnetAssessmentScore,
  updateDemeritPointSchema,
  demeritPointQuerySchema,
  classSchema,
  getStudentExportSchema,
  updateStudentProfileSchema,
  type CreateClassSchema,
  type CreateSubjectInput,
  type UpdateClassSchema,
  type SubjectQueriesSchema,
  type PatchSubjectInput,
  type ClassSchema,
  type ForgotPasswordSchema,
  type ResetPasswordSchema,
  type HomeroomClassStudentSchema,
  type CreateDemeritPointSchema,
  type BulkAttendanceSchema,
  type QueryStudentMarksSchema,
  type AttendanceSummaryQueriesSchema,
  type StudentAttendacesQueriesSchema,
  type CreateStudentAssessmentSchema,
  type GetStudentAssessmentSchema,
  type UpdateStudentAssessmentSchema,
  type GetStudnetAssessmentScore,
  type UpdateAssessmentScoresSchema,
  type UpdateDemeritPointSchema,
  type TeachingAssignmentInput,
  type UpdateStudentProfileSchema,
};
