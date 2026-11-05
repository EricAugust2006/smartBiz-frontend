"use client";

import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/axios";
import {
  authResponseSchema,
  registerResponseSchema,
  type AuthResponse,
  type LoginInput,
  type RegisterInput,
} from "@/lib/auth";

export function useB2BLogin() {
  return useMutation({
    mutationKey: ["auth", "b2b", "login"],
    retry: false,
    mutationFn: async (input: LoginInput): Promise<AuthResponse> => {
      const { data } = await api.post<unknown>("/auth/login", {
        email: input.email,
        password: input.password,
      });
      return authResponseSchema.parse(data);
    },
  });
}

export function useB2BRegister() {
  return useMutation({
    mutationKey: ["auth", "b2b", "register"],
    retry: false,
    mutationFn: async (input: RegisterInput): Promise<AuthResponse> => {
      const { data } = await api.post<unknown>("/auth/register", {
        tenantName: input.tenantName,
        userName: input.userName,
        email: input.email,
        password: input.password,
      });
      const registration = registerResponseSchema.parse(data);
      if (registration.access_token)
        return authResponseSchema.parse(registration);

      const session = await api.post<unknown>("/auth/login", {
        email: input.email,
        password: input.password,
      });
      return authResponseSchema.parse(session.data);
    },
  });
}
