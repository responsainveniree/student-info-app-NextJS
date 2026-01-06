export const ROLES = {
  // Student Roles
  STUDENT: "STUDENT",
  CLASS_SECRETARY: "CLASS_SECRETARY",
  // Staff Roles
  TEACHER: "TEACHER",
  VICE_PRINCIPAL: "VICE_PRINCIPAL",
  PRINCIPAL: "PRINCIPAL",
  //Outsider
  PARENT: "PARENT",
} as const;

// Role Groups - Add new roles to appropriate group
export const OUTSIDER_ROLES = [ROLES.PARENT] as const;
export const STUDENT_ROLES = [ROLES.STUDENT, ROLES.CLASS_SECRETARY] as const;
export const TEACHER_ROLES = [ROLES.TEACHER] as const;
export const STAFF_ROLES = [ROLES.VICE_PRINCIPAL, ROLES.PRINCIPAL] as const;
export const ALL_STAFF_ROLES = [...TEACHER_ROLES, ...STAFF_ROLES] as const;
export const ALL_ROLES = [
  ...STUDENT_ROLES,
  ...TEACHER_ROLES,
  ...STAFF_ROLES,
  ...OUTSIDER_ROLES,
] as const;

// Type definitions
export type Role = (typeof ALL_ROLES)[number];
export type StudentRole = (typeof STUDENT_ROLES)[number];
export type TeacherRole = (typeof TEACHER_ROLES)[number];
export type StaffRole = (typeof STAFF_ROLES)[number];
export type AllStaffRole = (typeof ALL_STAFF_ROLES)[number];
export type OutsiderRole = (typeof OUTSIDER_ROLES)[number];

export const isStudentRole = (role: string): role is StudentRole =>
  STUDENT_ROLES.includes(role as StudentRole);

export const isClassSecretaryRole = (role: string): role is StudentRole =>
  role === ROLES.CLASS_SECRETARY;

export const isTeacherRole = (role: string): role is TeacherRole =>
  TEACHER_ROLES.includes(role as TeacherRole);

export const isStaffRole = (role: string): role is StaffRole =>
  STAFF_ROLES.includes(role as StaffRole);

export const isAllStaffRole = (role: string): role is AllStaffRole =>
  ALL_STAFF_ROLES.includes(role as StaffRole);

export const isParentRole = (role: string): role is OutsiderRole =>
  role === ROLES.PARENT;

export const hasHomeroomTeacher = (role: string): boolean =>
  isStudentRole(role);

export const getRoleDashboard = (role: string): string => {
  if (isStudentRole(role)) return "/dashboard/student";
  if (isTeacherRole(role)) return "/dashboard/teacher";
  if (isStaffRole(role)) return "/dashboard/staff";
  if (isParentRole(role)) return "/dashboard/parent";
  return "/sign-in";
};

const ROLE_DISPLAY_NAME: Record<Role, string> = {
  STUDENT: "Student",
  CLASS_SECRETARY: "Class Secretary",
  TEACHER: "Teacher",
  VICE_PRINCIPAL: "Vice Principal",
  PRINCIPAL: "Principal",
  PARENT: "Parent",
};

export const getRoleDisplayName = (role: Role): string => {
  return ROLE_DISPLAY_NAME[role];
};
