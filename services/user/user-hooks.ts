import { useMutation, useQueryClient } from "@tanstack/react-query";
import { UserApi } from "./user-api";
import { toast } from "sonner";
import { STUDENT_KEY } from "@/lib/constants/tanStackQueryKeys";

export const useDeleteStudent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: string) => UserApi.delete(userId),
    onSuccess: (data) => {
      toast.success(data.message || "Student account deleted successfully");
      queryClient.invalidateQueries({
        queryKey: STUDENT_KEY.lists(),
      });
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete Student account");
    },
  });
};
