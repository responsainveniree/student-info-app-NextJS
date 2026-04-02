import { api } from "@/lib/api-client";

export const UserApi = {
  delete: async (userId: string) => {
    const response = await api.delete("/staff/user/delete", {
      params: { userId: userId },
    });

    return response.data;
  },
};
