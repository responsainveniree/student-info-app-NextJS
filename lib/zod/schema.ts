import { z } from "zod";

const schema = z.object({
  username: z.string().min(3),
  email: z.string().email(),
  password: z.string().min(8),
  confirmPassword: z.string().min(8),
});

type Schema = z.infer<typeof schema>;

export { schema, type Schema };
