"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/axios";
import {
  productListSchema,
  productPriceFromCents,
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
        price: productPriceFromCents(values.price),
        costPrice: productPriceFromCents(values.costPrice),
        quantity: Number(values.quantity || 0),
        minQuantity: Number(values.minQuantity || 0),
        expiresAt: values.expiresAt || null,
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
      values: Partial<ProductFormValues> & { isActive?: boolean };
    }): Promise<void> => {
      await api.patch(`/products/${encodeURIComponent(id)}`, {
        ...values,
        ...(values.price !== undefined ? { price: productPriceFromCents(values.price) } : {}),
        ...(values.costPrice !== undefined ? { costPrice: productPriceFromCents(values.costPrice) } : {}),
        ...(values.quantity !== undefined ? { quantity: Number(values.quantity || 0) } : {}),
        ...(values.minQuantity !== undefined ? { minQuantity: Number(values.minQuantity || 0) } : {}),
        ...(values.expiresAt !== undefined ? { expiresAt: values.expiresAt || null } : {}),
      });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey });
    },
  });
}
