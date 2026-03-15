import { notFound } from "../../lib/errors";

export function ensureClassroomExists(classroom: unknown) {
  if (!classroom) {
    throw notFound("Classroom not found");
  }
}
