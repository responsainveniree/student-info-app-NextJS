import { notFound } from "../../lib/errors";

export function ensureSubjectsExist(subjects: any[]) {
  if (subjects.length === 0) {
    throw notFound("No subjects found. Create subject data first.");
  }
}
