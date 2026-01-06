import { ClassNumber, Grade, Major } from "../constants/class";

export const SUBJECT_DISPLAY_MAP: Record<string, string> = {
  fundamentals_of_fluency_swe: "Fundamentals of Fluency SWE",
  fundamentals_of_fluency_accounting: "Fundamentals of Fluency Accounting",
  english: "English",
  civic_education: "Civic Education",
  math: "Mathematics",
  religion: "Religion",
  physical_education: "Physical Education",
  information_technology: "Information Technology",
  indonesian: "Indonesian",
  art: "Art",
  conversation: "Conversation",
  history: "History",
  fundamentals_of_science_and_social: "Fundamentals of Science & Social",
  mandarin: "Mandarin",
  ap: "Accounting Principles",
  creative_entrepreneurial_products_swe:
    "Creative Entrepreneurial Products SWE",
  creative_entrepreneurial_products_accounting:
    "Creative Entrepreneurial Products Accounting",
  pal: "PAL",
  computerized_accounting: "Computerized Accounting",
  financial_accounting: "Financial Accounting",
  banking: "Banking",
  microsoft: "Microsoft Office",
  taxation: "Taxation",
  web: "Web Development",
  database: "Database",
  oop: "Object Oriented Programming",
  mobile: "Mobile Development",
};

export const GRADE_DISPLAY_MAP: Record<string, string> = {
  TENTH: "Grade 10",
  ELEVENTH: "Grade 11",
  TWELFTH: "Grade 12",
};

export const MAJOR_DISPLAY_MAP: Record<string, string> = {
  SOFTWARE_ENGINEERING: "Software Engineering",
  ACCOUNTING: "Accounting",
};

export const STUDENT_ROLES_MAP: Record<string, string> = {
  STUDENT: "Student",
  CLASS_SECRETARY: "Class Secretary",
};

export function getMajorDisplayName(major: Major): string {
  return MAJOR_DISPLAY_MAP[major];
}

export function getGradeNumber(grade: Grade): string {
  switch (grade) {
    case "TENTH":
      return "10";
    case "ELEVENTH":
      return "11";
    case "TWELFTH":
      return "12";
  }
}

export function formatClassNumber(classNumber: ClassNumber): string {
  return classNumber === "none" ? "" : classNumber;
}
