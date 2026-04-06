import { STUDENT_KEY } from "@/lib/constants/tanStackQueryKeys";
import {
  StudentQuerySchema,
  UpdateStudentProfileSchema,
  UpdateStudentsClassSchema,
} from "@/lib/zod/student";
import {
  useMutation,
  useQuery,
  useQueryClient,
  UseQueryOptions,
} from "@tanstack/react-query";
import { StudentApi } from "./student-api";
import { StudentProfileResponse, StudentReponse } from "./student-types";
import { toast } from "sonner";

export const useStudent = (
  queries: StudentQuerySchema,
  options?: Partial<UseQueryOptions<StudentReponse>>,
) => {
  return useQuery({
    queryKey: STUDENT_KEY.list(queries),
    queryFn: () => StudentApi.getAllByClass(queries),
    ...options,
  });
};

export const useStudentProfile = (
  id: string,
  options?: Partial<UseQueryOptions<StudentProfileResponse>>,
) => {
  return useQuery({
    queryKey: STUDENT_KEY.detail(id),
    queryFn: () => StudentApi.getProfile(id),
    ...options,
  });
};

export const useUpdateStudent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateStudentProfileSchema) =>
      StudentApi.updateStudent(payload),
    onSuccess: (res) => {
      toast.success(res.message || "Student profile updated successfully");
      queryClient.invalidateQueries({
        queryKey: STUDENT_KEY.detail(res.data.studentId),
      });
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update student profile");
    },
  });
};

/**
 * @param {Object} queryParams - The current filters/pagination used for the student list.
 * Using these params as a specific query key ensures only the relevant data is refetched,
 * preventing unnecessary global invalidations that could impact performance.
 */
export const useUpdateStudentsClass = (queryParams: StudentQuerySchema) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateStudentsClassSchema) =>
      StudentApi.updateStudentsClass(payload),
    onSuccess: (res) => {
      toast.success(res.message || "Students class updated successfully");
      queryClient.invalidateQueries({
        queryKey: STUDENT_KEY.list(queryParams),
      });
    },
  });
};
