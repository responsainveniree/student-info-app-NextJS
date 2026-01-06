/**
 * Determines the semester based on the date.
 */
export function getSemester(date: Date): 1 | 2 {
  const month = date.getMonth() + 1;
  return month >= 7 && month <= 12 ? 1 : 2;
}

/**
 * Gets the valid date range for the current semester.
 */
export function getSemesterDateRange(referenceDate: Date): {
  start: Date;
  end: Date;
} {
  const year = referenceDate.getFullYear();
  const semester = getSemester(referenceDate);

  if (semester === 2) {
    return {
      start: new Date(year, 0, 1),
      end: new Date(year, 5, 30, 23, 59, 59, 999),
    };
  }

  return {
    start: new Date(year, 6, 1),
    end: new Date(year, 11, 31, 23, 59, 59, 999),
  };
}

/**
 * Gets the start and end of a specific day for date range queries.
 */
export function getDayBounds(date: Date): { startOfDay: Date; endOfDay: Date } {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  return { startOfDay, endOfDay };
}
