import { badRequest } from "../../lib/errors";

export function ensureEmailExist(user: unknown) {
  if (user) {
    throw badRequest("Email already registered");
  }
}
