"use client";

import { clearToken, getToken } from "@/lib/auth-token";
import { getMe, logout as logoutRequest } from "@/services/auth";
import type { User } from "@/types";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createContext, useCallback, useContext, useEffect, useState } from "react";

interface AuthContextValue {
  user?: User;
  isLoading: boolean;
  can: (permission: string) => boolean;
  signOut: () => Promise<void>;
  markSignedIn: (user: User) => void;
}

const AuthContext = createContext<AuthContextValue>({
  isLoading: true,
  can: () => false,
  signOut: async () => undefined,
  markSignedIn: () => undefined,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const [hasSession, setHasSession] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setHasSession(Boolean(getToken()));
    setReady(true);
  }, []);

  const { data: user, isLoading } = useQuery({
    queryKey: ["me"],
    queryFn: getMe,
    enabled: ready && hasSession,
    retry: false,
    gcTime: 0,
  });

  const endSession = useCallback(() => {
    clearToken();
    setHasSession(false);
    queryClient.removeQueries({ queryKey: ["me"] });
    queryClient.clear();
  }, [queryClient]);

  const signOut = useCallback(async () => {
    try {
      await logoutRequest();
    } finally {
      endSession();
    }
  }, [endSession]);

  const markSignedIn = useCallback(
    (next: User) => {
      setHasSession(true);
      queryClient.setQueryData(["me"], next);
    },
    [queryClient],
  );

  useEffect(() => {
    const onEnded = () => endSession();
    window.addEventListener("nova:session-ended", onEnded);
    return () => window.removeEventListener("nova:session-ended", onEnded);
  }, [endSession]);

  const sessionUser = hasSession ? user : undefined;
  const can = (permission: string) => sessionUser?.permissions?.includes(permission) ?? false;

  return (
    <AuthContext.Provider
      value={{
        user: sessionUser,
        isLoading: !ready || (hasSession && isLoading),
        can,
        signOut,
        markSignedIn,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
