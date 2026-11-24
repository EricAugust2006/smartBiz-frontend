"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/axios";
import {
  dashboardMetricsSchema,
  type DashboardMetrics,
} from "@/lib/dashboard-metrics";
import { getQueryCacheOptions, setCachedQuery } from "@/lib/query-cache";
import { useAuthStore } from "@/store/useAuthStore";

export function useDashboardMetrics() {
  const tenantId = useAuthStore((state) => state.tenant?.id);
  const userId = useAuthStore((state) => state.user?.id);
  const accessToken = useAuthStore((state) => state.accessToken);

  const queryKey = ["dashboard", "metrics", tenantId, userId] as const;

  return useQuery({
    queryKey,
    enabled: Boolean(tenantId && accessToken),
    retry: false,
    ...getQueryCacheOptions<DashboardMetrics>(queryKey),
    queryFn: async ({ signal }): Promise<DashboardMetrics> => {
      const { data } = await api.get<unknown>("/dashboard/metrics", {
        signal,
      });
      const metrics = dashboardMetricsSchema.parse(data);
      setCachedQuery(queryKey, metrics);
      return metrics;
    },
  });
}
