import { getSemester, getSemesterDateRange } from "@/lib/utils/date";
import { badRequest } from "@/lib/errors";

const today = new Date();
today.setHours(23, 59, 59, 59);

export function assertDateIsInCurrentSemester(date: Date) {
  const { start: semesterStart, end: semesterEnd } =
    getSemesterDateRange(today);
  if (date < semesterStart || date > semesterEnd) {
    const semesterNum = getSemester(today);
    throw badRequest(
      `Date is outside the current semester (Semester ${semesterNum}). ` +
        `Allowed range: ${semesterStart.toISOString().split("T")[0]} to ${semesterEnd.toISOString().split("T")[0]}.`,
    );
  }
}
