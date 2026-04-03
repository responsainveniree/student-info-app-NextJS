import { api } from "@/lib/api-client";
import {
  StudentQuerySchema,
  UpdateStudentProfileSchema,
} from "@/lib/zod/student";
import { StudentReponse } from "./student-types";

export const StudentApi = {
  getAll: async (queries: StudentQuerySchema) => {
    const response = await api.get("/student", {
      params: queries,
    });

    return response.data.data as StudentReponse;
  },
  updateStudent: async (payload: UpdateStudentProfileSchema) => {
    const response = await api.patch(
      "/staff/user/edit/single/student",
      payload,
    );

    return response.data;
  },
};
