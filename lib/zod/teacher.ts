import { z } from "zod";
import {
  classSchema,
  passwordSchema,
  teachingAssignmentInput,
} from "./general";

export const teacherSignUpSchema = z.object({
  username: z.string().min(3, { message: "Must be 3 characters at minimum" }),
  email: z.string().email({ message: "Please input a correct format" }),
  passwordSchema,
  homeroomClass: classSchema.optional(),
  assignments: z.array(teachingAssignmentInput).optional(),
});

export type TeacherSignUpSchema = z.infer<typeof teacherSignUpSchema>;
