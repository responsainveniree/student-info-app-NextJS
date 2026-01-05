export const VALID_ATTENDANCE_TYPES = ["ALPHA", "SICK", "PERMISSION"] as const;
export type ValidAttendanceType = (typeof VALID_ATTENDANCE_TYPES)[number];