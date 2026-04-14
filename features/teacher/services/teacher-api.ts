import { api } from "@/lib/api-client";
import { TeacherFetchType } from "@/lib/constants/teacher";
import { TeacherProfileResponse, TeachersResponse } from "../types/teacher";
import { ApiResponse } from "@/lib/types/api-response";
import { TeacherUpdateSchema } from "@/lib/zod/teacher";

export const teacherApi = {
  getAll: async (teacherFetchType: TeacherFetchType) => {
    const response = await api.get("/teacher", {
      params: {
        get: teacherFetchType,
      },
    });
    return response.data.data as TeachersResponse;
  },

  getProfile: async (id: string) => {
    const response = await api.get(`/teacher/profile/${id}`);

    return response.data as TeacherProfileResponse;
  },

  updateProfile: async (id: string, payload: TeacherUpdateSchema) => {
    const response = await api.patch(`staff/user/teacher/${id}`, payload);

    return response.data as ApiResponse;
  },
};
