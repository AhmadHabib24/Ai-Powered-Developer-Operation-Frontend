"use client";

import { getToken } from "@/lib/auth-token";
import { getMe } from "@/services/auth";
import type { User } from "@/types";
import { useQuery } from "@tanstack/react-query";
import { createContext, useContext } from "react";

interface AuthContextValue {
  user?: User;
  isLoading: boolean;
  can: (permission: string) => boolean;
}

const AuthContext = createContext<AuthContextValue>({ isLoading: true, can: () => false });

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { data: user, isLoading } = useQuery({
    queryKey: ["me"],
    queryFn: getMe,
    enabled: Boolean(getToken()),
    retry: false,
  });

  const can = (permission: string) => user?.permissions?.includes(permission) ?? false;

  return <AuthContext.Provider value={{ user, isLoading, can }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
