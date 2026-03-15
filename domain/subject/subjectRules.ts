import { badRequest } from "../../lib/errors";

export function ensureSubjectsExist(subjects: any[]) {
  if (subjects.length === 0) {
    throw badRequest(
      "No subjects found for this grade and major. Configure subjects first.",
    );
  }
}
