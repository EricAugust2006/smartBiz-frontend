"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/axios";
import {
  normalizeProductPrice,
  productListSchema,
  type Product,
  type ProductFormValues,
} from "@/lib/products";
import { useAuthStore } from "@/store/useAuthStore";

function useProductsScope() {
  const tenantId = useAuthStore((state) => state.tenant?.id);
  const userId = useAuthStore((state) => state.user?.id);
  const accessToken = useAuthStore((state) => state.accessToken);
  return {
    tenantId,
    queryKey: ["products", tenantId, userId] as const,
    enabled: Boolean(tenantId && accessToken),
  };
}

export function useProducts(search = "", category = "") {
  const scope = useProductsScope();
  const normalizedSearch = search.trim();
  return useQuery({
    queryKey: [...scope.queryKey, { search: normalizedSearch, category }],
    enabled: scope.enabled,
    retry: false,
    queryFn: async ({ signal }): Promise<Product[]> => {
      const { data } = await api.get<unknown>("/products", {
        params: {
          search: normalizedSearch || undefined,
          category: category || undefined,
        },
        signal,
      });
      return productListSchema.parse(data);
    },
  });
}

export function useCreateProduct() {
  const { queryKey } = useProductsScope();
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: [...queryKey, "create"],
    retry: false,
    mutationFn: async (values: ProductFormValues): Promise<void> => {
      await api.post("/products", {
        ...values,
        price: normalizeProductPrice(values.price),
      });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey });
    },
  });
}

export function useUpdateProduct() {
  const { queryKey } = useProductsScope();
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: [...queryKey, "update"],
    retry: false,
    mutationFn: async ({
      id,
      values,
    }: {
      id: string;
      values: ProductFormValues & { isActive: boolean };
    }): Promise<void> => {
      await api.patch(`/products/${encodeURIComponent(id)}`, {
        ...values,
        price: normalizeProductPrice(values.price),
      });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey });
    },
  });
}
