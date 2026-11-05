import { useAuthStore } from "../store/useAuthStore";

import type {
  AuthTenant as Tenant,
  AuthUser as Owner,
  AuthResponse as LoginResponse,
} from "@/lib/auth";
export type { Tenant, Owner, LoginResponse };

export type CreateTenantResponse = {
  tenant: Tenant;
  owner: Owner;
};

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_URL?.trim() || "http://localhost:3000"
).replace(/\/+$/, "");

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set("Accept", "application/json");
  if (options.body) headers.set("Content-Type", "application/json");

  const token = useAuthStore.getState().accessToken;
  if (token) headers.set("Authorization", `Bearer ${token}`);

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers,
    });
  } catch {
    throw new ApiError(
      "Não foi possível conectar ao servidor. Verifique se o backend está em execução.",
      0,
    );
  }

  const rawBody = await response.text();
  let body: unknown;
  if (rawBody) {
    try {
      body = JSON.parse(rawBody);
    } catch {
      if (response.ok) {
        throw new ApiError(
          "O servidor retornou uma resposta inválida.",
          response.status,
        );
      }
      body = rawBody;
    }
  }

  if (!response.ok) {
    const apiMessage =
      typeof body === "object" && body !== null && "message" in body
        ? body.message
        : undefined;
    const message = Array.isArray(apiMessage)
      ? apiMessage.join(" ")
      : typeof apiMessage === "string"
        ? apiMessage
        : undefined;

    if (response.status === 401) {
      throw new ApiError(
        "E-mail ou senha incorretos, ou sessão expirada.",
        401,
      );
    }
    if (response.status === 409) {
      throw new ApiError("Este endereço ou e-mail já está cadastrado.", 409);
    }

    throw new ApiError(
      message ?? "Não foi possível concluir a solicitação.",
      response.status,
    );
  }

  return body as T;
}

export function login(email: string, password: string) {
  return request<LoginResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export function createTenant(input: {
  name: string;
  slug: string;
  ownerName: string;
  email: string;
  password: string;
}) {
  return request<CreateTenantResponse>("/tenants", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function getCurrentTenant() {
  return request<Tenant>("/tenants/me");
}

export function getApiErrorMessage(error: unknown, fallback: string) {
  return error instanceof ApiError ? error.message : fallback;
}
