import { string, z } from "zod";

const zodStudentSignUp = z.object({
  username: z.string().min(3),
  email: z.string().email(),
  password: z.string().min(8),
  confirmPassword: z.string().min(8),
  grade: z.enum(["tenth", "eleventh", "twelfth"]),
  major: z.enum(["accounting", "softwareEngineering"]),
  classNumber: z.number().max(2),
  teacherName: z.string(),
});

const zodTeacherSignUp = z.object({
  username: z.string().min(3),
  email: z.string().email(),
  password: z.string().min(8),
  confirmPassword: z.string().min(8),
});

type zodStudentSignUpSchema = z.infer<typeof zodStudentSignUp>;
type zodTeacherSignUpSchema = z.infer<typeof zodTeacherSignUp>;

export {
  zodStudentSignUp,
  zodTeacherSignUp,
  type zodStudentSignUpSchema,
  type zodTeacherSignUpSchema,
};
