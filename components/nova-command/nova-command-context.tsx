"use client";

import { createContext, useContext } from "react";

export interface NovaCommandContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
  muted: boolean;
  toggleMuted: () => void;
  canEngage: boolean;
}

export const NovaCommandContext = createContext<NovaCommandContextValue | null>(null);

export function useNovaCommand() {
  const value = useContext(NovaCommandContext);
  if (!value) {
    throw new Error("useNovaCommand must be used inside NovaCommandProvider");
  }
  return value;
}
