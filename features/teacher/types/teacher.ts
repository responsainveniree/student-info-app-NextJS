import { getTeachers } from "../server/services/teacher-service";

export type TeachersResponse = Awaited<ReturnType<typeof getTeachers>>;
