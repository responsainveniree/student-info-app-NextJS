import { z } from "zod";

const GradeEnum = z.enum(["tenth", "eleventh", "twelfth"]);
const MajorEnum = z.enum(["accounting", "softwareEngineering"]);

const classTeachingAssignment = z.object({
  teacherId: z.string(),
  subjectId: z.number(),
  grade: GradeEnum,
  major: MajorEnum,
  classNumber: z.string().optional(),
  subjectName: z.string(),
});

const ClassInfoSchema = z.object({
  grade: GradeEnum,
  major: MajorEnum,
  classNumber: z.string().optional(),
});

// Main

const zodStudentSignUp = z.object({
  username: z.string().min(3),
  email: z.string().email(),
  password: z.string().min(8),
  confirmPassword: z.string().min(8),

  grade: GradeEnum,
  major: MajorEnum,
  classNumber: z.string().optional(),

  teacherName: z.string(),
});

const zodTeacherSignUp = z.object({
  username: z.string().min(3),
  email: z.string().email(),
  password: z.string().min(8),
  confirmPassword: z.string().min(8),

  homeroomClass: ClassInfoSchema.optional(),

  teachingAssignment: z.array(classTeachingAssignment).optional(),

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
