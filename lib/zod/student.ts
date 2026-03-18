import { z } from "zod";
import { classSchema, passwordSchema, StudentRoleEnum } from "./general";

export const studentSignUpSchema = z.object({
  username: z.string().min(3, { message: "Must be 3 characters at minimum" }),
  email: z.string().email({ message: "Please input a correct format" }),
  passwordSchema,
  classSchema,
  studentRole: StudentRoleEnum,
});

export type StudentSignUpSchema = z.infer<typeof studentSignUpSchema>;
