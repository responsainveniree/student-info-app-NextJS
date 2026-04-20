import axios from "axios";
import { getSession } from "next-auth/react";
import { toast } from "sonner";
import { getErrorMessage } from "./utils/getErrorMessage";

export const api = axios.create({
  baseURL: "/api",
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(async (config) => {
  const session = await getSession();

  if (session?.user.accessToken) {
    config.headers.Authorization = `Bearer ${session.user.accessToken}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (!error.response) {
      toast.error("Network error. Please check your connection.");
      return Promise.reject(error);
    }

    const message = await getErrorMessage(error);

    const status = error.response?.status;

    if (status === 401 && typeof window !== "undefined") {
      toast.error("Unauthorized. Redirecting...");
      window.location.replace("/login");
    }

    if (status >= 400 && status !== 401) {
      toast.error(message);
    }

    if (status >= 500) {
      toast.error("Server error. We're working on it!");
    }

    return Promise.reject(new Error(message));
  },
);
