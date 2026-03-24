import { z } from "zod";
import {
  AssessmentType,
  classSchema,
  ClassSectionEnum,
  GradeEnum,
  MajorEnum,
  page,
} from "./general";

// SCORING SYSTEM (TEACHER)
export const queryStudentMarks = z.object({
  studentId: z.string().min(1),
  subjectName: z.string().min(1).optional(),
  isMarkPage: z
    .enum(["true", "false"])
    .optional()
    .transform((val) => val === "true"),
  page,
});

export type QueryStudentMarksSchema = z.infer<typeof queryStudentMarks>;

const descriptionSchema = z.object({
  givenAt: z.string({ message: "Given at Must be filled" }),
  dueAt: z.string({ message: "Due at Must be filled" }),
  title: z
    .string({ message: "Title must be filled" })
    .max(20, { message: "Title must not exceed 20 characters" }),
});

// CRUD Assessment Schema
export const createStudentAssessmentSchema = z.object({
  class: classSchema,
  subjectId: z.number({ message: "Must be filled" }),
  subjectName: z.string({ message: "Must be filled" }),
  assessmentType: AssessmentType,
  description: descriptionSchema,
});

export type CreateStudentAssessmentSchema = z.infer<
  typeof createStudentAssessmentSchema
>;

export const getStudentAssessmentSchema = z.object({
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

export type GetStudentAssessmentSchema = z.infer<
  typeof getStudentAssessmentSchema
>;

export const updateStudentAssessmentSchema = z.object({
  assessmentId: z.number({ message: "Assessment id must be filled" }),
  teachingAssignmentId: z.number({
    message: "Teaching assignment id must be filled",
  }),
  assessmentType: AssessmentType,
  descriptionSchema,
});

export type UpdateStudentAssessmentSchema = z.infer<
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

export const updateAssessmentScoresSchema = z.object({
  subjectId: z.number({ message: "Subject id field must be filled" }),
  classId: z.number({ message: "Class id field must be filled" }),
  students: z
    .array(studentMarkData)
    .nonempty({ message: "student data can't be empty" }),
});

export type UpdateAssessmentScoresSchema = z.infer<
  typeof updateAssessmentScoresSchema
>;

// getStudnetAssessmentScore based on the subject
export const getStudentAssessmentScore = z.object({
  subjectId: z
    .string()
    .min(1)
    .transform((value) => Number(value)),
  page,
});

export type GetStudnetAssessmentScore = z.infer<
  typeof getStudentAssessmentScore
>;
