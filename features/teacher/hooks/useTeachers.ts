import { TEACHER_KEYS } from "@/lib/constants/tanStackQueryKeys";
import { useQuery, UseQueryOptions } from "@tanstack/react-query";
import { teacherApi } from "../services/teacher-api";
import { TeacherFetchType } from "@/lib/constants/teacher";
import { TeachersResponse } from "../types/teacher";

export const useTeachers = (
  teacherFetchType: TeacherFetchType,
  options?: Partial<UseQueryOptions<TeachersResponse>>,
) => {
  return useQuery({
    queryKey: TEACHER_KEYS.lists(),
    queryFn: () => teacherApi.getAll(teacherFetchType),
    ...options,
  });
};
