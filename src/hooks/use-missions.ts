"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/axios";
import {
  missionListSchema,
  type CreateMissionInput,
  type Mission,
  type MissionStatus,
} from "@/lib/missions";
import { useAuthStore } from "@/store/useAuthStore";

function useMissionsScope() {
  const tenantId = useAuthStore((state) => state.tenant?.id);
  const userId = useAuthStore((state) => state.user?.id);
  const accessToken = useAuthStore((state) => state.accessToken);
  return {
    queryKey: ["missions", tenantId, userId] as const,
    enabled: Boolean(tenantId && accessToken),
  };
}

export function useMissions() {
  const scope = useMissionsScope();
  return useQuery({
    ...scope,
    retry: false,
    queryFn: async ({ signal }): Promise<Mission[]> => {
      const { data } = await api.get<unknown>("/missions", { signal });
      return missionListSchema.parse(data);
    },
  });
}

export function useCreateMission() {
  const { queryKey } = useMissionsScope();
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: [...queryKey, "create"],
    retry: false,
    mutationFn: async (payload: CreateMissionInput): Promise<void> => {
      await api.post("/missions", payload);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey });
    },
  });
}

export function useUpdateMissionStatus() {
  const { queryKey } = useMissionsScope();
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: [...queryKey, "status"],
    retry: false,
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey });
    },
    mutationFn: async ({
      id,
      status,
    }: {
      id: string;
      status: MissionStatus;
    }): Promise<void> => {
      await api.patch(`/missions/${encodeURIComponent(id)}/status`, { status });
    },
    onSuccess: (_data, { id, status }) => {
      queryClient.setQueryData<Mission[]>(queryKey, (missions) =>
        missions?.map((mission) =>
          mission.id === id ? { ...mission, status } : mission,
        ),
      );
      void queryClient.invalidateQueries({ queryKey });
    },
  });
}
