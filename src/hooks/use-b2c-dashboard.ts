"use client";

import { useQuery } from "@tanstack/react-query";
import { b2cApi as api } from "@/lib/axios";
import {
  b2cDashboardSchema,
  type B2CDashboard,
} from "@/lib/customer-dashboard";
import { useB2CAuthStore } from "@/store/useB2CAuthStore";

export function useB2CDashboard() {
  const token = useB2CAuthStore((state) => state.token);
  const hydrated = useB2CAuthStore((state) => state.hydrated);
  const version = useB2CAuthStore((state) => state.sessionVersion);
  return useQuery({
    queryKey: ["b2c", "dashboard", version],
    enabled: hydrated && Boolean(token),
    retry: false,
    staleTime: 30_000,
    queryFn: async ({ signal }): Promise<B2CDashboard> => {
      const { data } = await api.get<unknown>("/b2c/dashboard", { signal });
      return b2cDashboardSchema.parse(data);
    },
  });
}
