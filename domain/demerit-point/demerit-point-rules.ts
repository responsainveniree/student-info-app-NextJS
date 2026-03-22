import {
  categoryLabelMap,
  SINGLE_PER_DAY_CATEGORIES,
  SinglePerDayCategories,
  ValidInfractionType,
} from "@/lib/constants/discplinary";
import {
  DemeritPointWithStudent,
  StudentWithDemerits,
} from "../types/demerit-types";
import { badRequest } from "@/lib/errors";

// The funcionality of "category is SinglePerDayCategories" is if the function return true, the category must be "LATE" or "INCOMPLETE_ATTRIBUTES"
export function isSinglePerDayCategory(
  category: ValidInfractionType,
): category is SinglePerDayCategories {
  return SINGLE_PER_DAY_CATEGORIES.includes(category as SinglePerDayCategories);
}

// The limit is once / day
export function validateDailyDemeritLimit(student: StudentWithDemerits) {
  const demerits = student.studentProfile?.demerits || [];

  const conflict = demerits.find((d) => isSinglePerDayCategory(d.category));

  if (conflict) {
    throw badRequest(
      `This ${student.name} already has "${categoryLabelMap[conflict.category]}" problem. Only one per day`,
    );
  }
}
