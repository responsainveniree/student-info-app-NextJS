import { TEACHER_KEYS } from "@/lib/constants/tanStackQueryKeys";
import {
  useMutation,
  useQuery,
  useQueryClient,
  UseQueryOptions,
} from "@tanstack/react-query";
import { teacherApi } from "../services/teacher-api";
import { TeacherFetchType } from "@/lib/constants/teacher";
import { TeacherProfileResponse, TeachersResponse } from "../types/teacher";
import { toast } from "sonner";
import { UserApi } from "@/features/user/service/user-api";
import { getErrorMessage } from "@/lib/utils/getErrorMessage";
import { TeacherUpdateSchema } from "@/lib/zod/teacher";
import { TableOfContents } from "lucide-react";

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

export const useTeacherProfile = (
  id: string,
  options?: Partial<UseQueryOptions<TeacherProfileResponse>>,
) => {
  return useQuery({
    queryKey: TEACHER_KEYS.list(id),
    queryFn: () => teacherApi.getProfile(id),
    ...options,
  });
};

export const useUpdateTeacherProfile = (id: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: TeacherUpdateSchema) =>
      teacherApi.updateProfile(id, payload),
    onSuccess: (data) => {
      toast.success(data.message || "Teacher account updated successfully");
      queryClient.invalidateQueries({
        queryKey: TEACHER_KEYS.list(id),
      });
    },
    onError: async (error) => {
      const errorMessage = getErrorMessage(error);
      toast.error(errorMessage || "Failed to update teacher accoutn");
    },
  });
};

export const useDeleteTeacher = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: string) => UserApi.delete(userId),
    onSuccess: (data) => {
      toast.success(data.message || "Teacher account deleted successfully");
      queryClient.invalidateQueries({
        queryKey: TEACHER_KEYS.lists(),
      });
    },
    onError: async (error) => {
      const errorMessage = getErrorMessage(error);
      toast.error(errorMessage || "Failed to delete Teacher account");
    },
  });
};
