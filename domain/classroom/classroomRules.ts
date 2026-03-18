import { ClassSection, Grade, Major } from "@/lib/constants/class";
import { notFound } from "../../lib/errors";

/**
 * Ensures a classroom exists in the system.
 * * @param classroom - The result of a database lookup (null/undefined if not found)
 * @throws {NotFoundError} If the classroom object is undefined/null
 */
export function ensureClassroomExists(classroom: unknown) {
  if (!classroom) {
    throw notFound("Classroom not found");
  }
}
