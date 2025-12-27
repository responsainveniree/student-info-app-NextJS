export const ROLES = {
    // Student Roles
    STUDENT: "STUDENT",
    CLASS_SECRETARY: "CLASS_SECRETARY",
    // Staff Roles
    TEACHER: "TEACHER",
    VICE_PRINCIPAL: "VICE_PRINCIPAL",
    PRINCIPAL: "PRINCIPAL",
} as const;

// Role Groups - Add new roles to appropriate group
export const STUDENT_ROLES = [ROLES.STUDENT, ROLES.CLASS_SECRETARY] as const;
export const TEACHER_ROLES = [ROLES.TEACHER] as const;
export const STAFF_ROLES = [ROLES.VICE_PRINCIPAL, ROLES.PRINCIPAL] as const;
export const ALL_STAFF_ROLES = [...TEACHER_ROLES, ...STAFF_ROLES] as const;
export const ALL_ROLES = [...STUDENT_ROLES, ...TEACHER_ROLES, ...STAFF_ROLES] as const;

// Type definitions
export type Role = (typeof ALL_ROLES)[number];
export type StudentRole = (typeof STUDENT_ROLES)[number];
export type TeacherRole = (typeof TEACHER_ROLES)[number];
export type StaffRole = (typeof STAFF_ROLES)[number];


export const isStudentRole = (role: string): role is StudentRole =>
    STUDENT_ROLES.includes(role as StudentRole);

export const isClassSecretaryRole = (role: string): role is StudentRole =>
    role === ROLES.CLASS_SECRETARY;

export const isTeacherRole = (role: string): role is TeacherRole =>
    TEACHER_ROLES.includes(role as TeacherRole);

export const isStaffRole = (role: string): role is StaffRole =>
    STAFF_ROLES.includes(role as StaffRole);


export const hasHomeroomTeacher = (role: string): boolean => isStudentRole(role);


export const getRoleDashboard = (role: string): string => {
    if (isStudentRole(role)) return "/student-dashboard";
    if (isTeacherRole(role)) return "/teacher-dashboard";
    if (isStaffRole(role)) return "/staff-dashboard";
    return "/sign-in";
};

export const getRoleDisplayName = (role: string): string => {
    switch (role) {
        case ROLES.STUDENT:
            return "Student";
        case ROLES.CLASS_SECRETARY:
            return "Class Secretary";
        case ROLES.TEACHER:
            return "Teacher";
        case ROLES.VICE_PRINCIPAL:
            return "Vice Principal";
        case ROLES.PRINCIPAL:
            return "Principal";
        default:
            return role;
    }
};
