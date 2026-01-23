export const GRADES = ["TENTH", "ELEVENTH", "TWELFTH"] as const;
export type Grade = (typeof GRADES)[number];

export const MAJORS = ["ACCOUNTING", "SOFTWARE_ENGINEERING"] as const;
export type Major = (typeof MAJORS)[number];

export const CLASSNUMBERS = ["none", "1", "2"] as const;
export type ClassNumber = (typeof CLASSNUMBERS)[number];

export const SEMESTERS = ["FIRST", "SECOND"] as const;
export type Semester = (typeof SEMESTERS)[number];
