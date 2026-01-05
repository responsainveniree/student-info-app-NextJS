export const VALID_PROBLEM_POINT_TYPES = [
  "LATE",
  "INCOMPLETE_ATTRIBUTES",
  "DISCIPLINE",
  "ACADEMIC",
  "SOCIAL",
  "OTHER",
] as const;
export type ValidProblemPointType = (typeof VALID_PROBLEM_POINT_TYPES)[number];

export const SINGLE_PER_DAY_CATEGORIES = [
  "LATE",
  "INCOMPLETE_ATTRIBUTES",
] as const;
export type SinglePerDayCategories = (typeof SINGLE_PER_DAY_CATEGORIES)[number];

export const categoryLabelMap: Record<string, string> = {
  LATE: "Late",
  INCOMPLETE_ATTRIBUTES: "Incomplete Attributes",
};
