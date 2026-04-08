import { api } from "@/lib/api-client";
import { TeacherFetchType } from "@/lib/constants/teacher";
import { TeachersResponse } from "../types/teacher";

export const teacherApi = {
  getAll: async (teacherFetchType: TeacherFetchType) => {
    const response = await api.get("/teacher", {
      params: {
        get: teacherFetchType,
      },
    });
    return response.data.data as TeachersResponse;
  },
};
