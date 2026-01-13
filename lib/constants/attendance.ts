export const VALID_ATTENDANCE_TYPES = [
  "ALPHA",
  "SICK",
  "PERMISSION",
  "LATE",
] as const;
export type ValidAttendanceType = (typeof VALID_ATTENDANCE_TYPES)[number];
