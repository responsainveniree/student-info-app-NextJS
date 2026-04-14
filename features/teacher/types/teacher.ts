import {
  getTeacherProfile,
  getTeachers,
} from "../server/services/teacher-service";

export type TeachersResponse = Awaited<ReturnType<typeof getTeachers>>;

export type TeacherProfileResponse = Awaited<
  ReturnType<typeof getTeacherProfile>
>;
