import api from "@/lib/api";
import { clearToken, setToken } from "@/lib/auth-token";
import type { User } from "@/types";

export async function login(email: string, password: string) {
  const { data } = await api.post<{ data: User; meta: { token: string } }>("/api/v1/auth/login", {
    email,
    password,
  });
  setToken(data.meta.token);
  return data.data;
}

export async function logout() {
  try {
    await api.post("/api/v1/auth/logout");
  } finally {
    clearToken();
  }
}

export async function getMe() {
  const { data } = await api.get<{ data: User }>("/api/v1/auth/me");
  return data.data;
}

export async function forgotPassword(email: string) {
  const { data } = await api.post("/api/v1/auth/forgot-password", { email });
  return data;
}

export async function resetPassword(payload: {
  email: string;
  token: string;
  password: string;
  password_confirmation: string;
}) {
  const { data } = await api.post("/api/v1/auth/reset-password", payload);
  return data;
}
