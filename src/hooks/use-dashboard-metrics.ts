"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/axios";
import {
  dashboardMetricsSchema,
  type DashboardMetrics,
} from "@/lib/dashboard-metrics";
import { useAuthStore } from "@/store/useAuthStore";

export function useDashboardMetrics() {
  const tenantId = useAuthStore((state) => state.tenant?.id);
  const userId = useAuthStore((state) => state.user?.id);
  const accessToken = useAuthStore((state) => state.accessToken);

  return useQuery({
    queryKey: ["dashboard", "metrics", tenantId, userId],
    enabled: Boolean(tenantId && accessToken),
    retry: false,
    queryFn: async ({ signal }): Promise<DashboardMetrics> => {
      const { data } = await api.get<unknown>("/dashboard/metrics", {
        signal,
      });
      return dashboardMetricsSchema.parse(data);
    },
  });
}
