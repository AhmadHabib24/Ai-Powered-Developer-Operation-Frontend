import axios from "axios";
import { clearToken, getToken } from "@/lib/auth-token";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000",
  withCredentials: false,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
    "X-Requested-With": "XMLHttpRequest",
  },
});

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  if (typeof FormData !== "undefined" && config.data instanceof FormData) {
    delete config.headers["Content-Type"];
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== "undefined" && !window.location.pathname.startsWith("/login")) {
      clearToken();
    }
    return Promise.reject(error);
  },
);

export function apiErrorMessage(error: unknown, fallback = "Request failed") {
  if (axios.isAxiosError(error)) {
    const code = error.response?.data?.code;
    if (error.response?.status === 401 || code === "UNAUTHENTICATED") {
      return "Your session expired. Please sign in again.";
    }
    if (error.response?.status === 403 || code === "FORBIDDEN") {
      return "You do not have permission to view this.";
    }
    if (error.response?.status === 409 || code === "CONFLICT") {
      return error.response?.data?.message ?? "Another timer is already running.";
    }
    if (error.response?.status === 419 || code === "CSRF_MISMATCH") {
      return "Security token expired. Refresh and sign in again.";
    }
    return error.response?.data?.message ?? fallback;
  }
  return fallback;
}

export default api;
