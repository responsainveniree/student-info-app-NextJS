// General roles
export const GENERAL_ROLES = {
  ADMIN: "ADMIN",
  STAFF: "STAFF",
  STUDENT: "STUDENT",
  PARENT: "PARENT",
} as const;

// Spesific for each general roles
export const STAFF_POSITIONS = {
  TEACHER: "TEACHER",
  VICE_PRINCIPAL: "VICE_PRINCIPAL",
  PRINCIPAL: "PRINCIPAL",
} as const;

export const MANAGEMENT_POSITIONS = {
  VICE_PRINCIPAL: "VICE_PRINCIPAL",
  PRINCIPAL: "PRINCIPAL",
} as const;

export const STUDENT_POSITIONS = {
  STUDENT: "STUDENT",
  CLASS_SECRETARY: "CLASS_SECRETARY",
} as const;

// Role Groups - Add new roles to appropriate group
export const STUDENT_POSITIONS_ARRAY = Object.values(STUDENT_POSITIONS);
export const STAFF_POSITIONS_ARRAY = Object.values(STAFF_POSITIONS);
export const MANAGEMENT_POSITIONS_ARRAY = [
  STAFF_POSITIONS.PRINCIPAL,
  STAFF_POSITIONS.VICE_PRINCIPAL,
] as const;

// Type definitions
export type GeneralRole = (typeof GENERAL_ROLES)[keyof typeof GENERAL_ROLES];
export type StaffPosition =
  (typeof STAFF_POSITIONS)[keyof typeof STAFF_POSITIONS];
export type StudentPosition =
  (typeof STUDENT_POSITIONS)[keyof typeof STUDENT_POSITIONS];
export type ManagementPosition =
  (typeof MANAGEMENT_POSITIONS)[keyof typeof MANAGEMENT_POSITIONS];

export type allCombinedPosition = StaffPosition | StudentPosition | GeneralRole;

export const isStudentRole = (
  role: allCombinedPosition,
): role is StudentPosition =>
  STUDENT_POSITIONS_ARRAY.includes(role as StudentPosition);

export const isClassSecretaryRole = (
  role: allCombinedPosition,
): role is StudentPosition => role === STUDENT_POSITIONS.CLASS_SECRETARY;

export const isTeacherRole = (
  role: allCombinedPosition,
): role is StaffPosition =>
  STAFF_POSITIONS_ARRAY.includes(role as StaffPosition);

export const hasManagementAccess = (
  role: allCombinedPosition,
): role is ManagementPosition =>
  MANAGEMENT_POSITIONS_ARRAY.includes(role as ManagementPosition);

export const isAllStaffRole = (
  role: allCombinedPosition,
): role is StaffPosition =>
  STAFF_POSITIONS_ARRAY.includes(role as StaffPosition);

export const isParentRole = (role: allCombinedPosition): role is GeneralRole =>
  role === GENERAL_ROLES.PARENT;

export const isAdminRole = (role: allCombinedPosition): role is GeneralRole =>
  role === GENERAL_ROLES.ADMIN;

export const hasHomeroomTeacher = (role: allCombinedPosition): boolean =>
  isStudentRole(role);

export const getRoleDashboard = (role: allCombinedPosition): string => {
  if (isAdminRole(role)) return "/dashboard/admin";
  if (hasManagementAccess(role)) return "/dashboard/staff";
  if (isTeacherRole(role)) return "/dashboard/teacher";
  if (isStudentRole(role)) return "/dashboard/student";
  if (isParentRole(role)) return "/dashboard/parent";
  return "/sign-in";
};

const ROLE_DISPLAY_NAME: Record<allCombinedPosition, string> = {
  STUDENT: "Student",
  CLASS_SECRETARY: "Class Secretary",
  TEACHER: "Teacher",
  VICE_PRINCIPAL: "Vice Principal",
  PRINCIPAL: "Principal",
  PARENT: "Parent",
  ADMIN: "Admin",
  // Unused, TS Ask for it
  STAFF: "Staff",
};

export const getRoleDisplayName = (role: allCombinedPosition): string => {
  return ROLE_DISPLAY_NAME[role];
};
