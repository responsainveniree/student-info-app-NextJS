import { badRequest } from "../../lib/errors";

/**
 * Validates that a user does not already exist with the provided email.
 * This is used during registration to prevent duplicate accounts.
 * * @param user - The result of a database lookup (null/undefined if not found)
 * @throws {BadRequestError} If the user object is present (email already taken)
 */
export function validateEmailUniqueness(user: unknown): void {
  // If 'user' is truthy, it means a record was found in the database.
  if (user) {
    throw badRequest("Email already registered");
  }
}
