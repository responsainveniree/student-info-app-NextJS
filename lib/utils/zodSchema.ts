import { z } from "zod";

const zodSignUp = z.object({
  username: z.string().min(3),
  email: z.string().email(),
  password: z.string().min(8),
  confirmPassword: z.string().min(8),
});

type zodSignUpSchema = z.infer<typeof zodSignUp>;

export { zodSignUp, type zodSignUpSchema };
