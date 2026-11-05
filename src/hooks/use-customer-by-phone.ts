"use client";

import { useQuery } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { z } from "zod";
import { api } from "@/lib/axios";
import { customerPhoneSchema } from "@/lib/sales";
import { useAuthStore } from "@/store/useAuthStore";

const customerSchema = z.object({ name: z.string().trim().min(1) });
export type CustomerByPhone = z.infer<typeof customerSchema>;

export function useCustomerByPhone(phone: string) {
  const tenantId = useAuthStore((state) => state.tenant?.id);
  const userId = useAuthStore((state) => state.user?.id);
  const accessToken = useAuthStore((state) => state.accessToken);

  return useQuery({
    queryKey: ["customers", tenantId, userId, "by-phone", phone],
    enabled: Boolean(
      tenantId && accessToken && customerPhoneSchema.safeParse(phone).success,
    ),
    retry: false,
    staleTime: 0,
    queryFn: async ({ signal }): Promise<CustomerByPhone | null> => {
      try {
        const { data } = await api.get<unknown>("/customers/by-phone", {
          params: { phone },
          signal,
        });
        return data == null ? null : customerSchema.parse(data);
      } catch (error: unknown) {
        if (isAxiosError(error) && error.response?.status === 404) return null;
        throw error;
      }
    },
  });
}
