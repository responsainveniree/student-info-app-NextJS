const SUBJECT_TYPE = ["GENERAL", "MAJOR"] as const;
export type SubjectType = (typeof SUBJECT_TYPE)[number];
