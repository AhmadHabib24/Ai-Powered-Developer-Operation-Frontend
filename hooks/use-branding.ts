import { getBranding } from "@/services/settings";
import { useQuery } from "@tanstack/react-query";

export function useBranding() {
  return useQuery({
    queryKey: ["branding"],
    queryFn: getBranding,
    staleTime: 60_000,
  });
}
