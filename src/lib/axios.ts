import axios from "axios";
import { useAuthStore } from "@/store/useAuthStore";
import { useB2CAuthStore } from "@/store/useB2CAuthStore";

export const api = axios.create({
  baseURL: (
    process.env.NEXT_PUBLIC_API_URL?.trim() || "http://localhost:3000"
  ).replace(/\/+$/, ""),
  timeout: 15_000,
  headers: { Accept: "application/json" },
});

// Read the current session for every request, including after signing in again.
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token && config.url !== "/auth/login" && config.url !== "/auth/register")
    config.headers.set("Authorization", `Bearer ${token}`);
  else config.headers.delete("Authorization");
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (
      axios.isAxiosError(error) &&
      error.response?.status === 401 &&
      error.config?.url !== "/auth/login" &&
      error.config?.url !== "/auth/register"
    ) {
      const session = useAuthStore.getState();
      if (
        session.accessToken &&
        error.config?.headers.get("Authorization") ===
          `Bearer ${session.accessToken}`
      ) {
        session.clearSession(
          "Sua sessão expirou. Entre novamente para continuar.",
        );
      }
    }
    return Promise.reject(error);
  },
);

// Separate instance: B2C requests never inherit the owner's Authorization header.
export const b2cApi = axios.create({
  baseURL: api.defaults.baseURL,
  timeout: 15_000,
  headers: { Accept: "application/json" },
});

b2cApi.interceptors.request.use((config) => {
  const token = useB2CAuthStore.getState().token;
  if (token && config.url !== "/auth/b2c")
    config.headers.set("Authorization", `Bearer ${token}`);
  else config.headers.delete("Authorization");
  return config;
});

b2cApi.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (
      axios.isAxiosError(error) &&
      (error.response?.status === 401 || error.response?.status === 403)
    ) {
      const session = useB2CAuthStore.getState();
      // A late failure from the previous session must not log out a new customer.
      if (
        session.token &&
        error.config?.headers.get("Authorization") === `Bearer ${session.token}`
      ) {
        session.clearSession(
          error.response.status === 401
            ? "Seu token expirou ou é inválido. Entre novamente com um JWT B2C."
            : "Este token não tem acesso ao App do Cliente. Use um JWT com role B2C.",
        );
      }
    }
    return Promise.reject(error);
  },
);

export function getRequestErrorMessage(
  error: unknown,
  fallback: string,
): string {
  if (!axios.isAxiosError<unknown>(error)) return fallback;
  if (error.response?.status === 401)
    return "Sua sess\u00e3o expirou. Entre novamente para continuar.";
  if (error.response?.status === 403)
    return "Sua conta n\u00e3o tem permiss\u00e3o para realizar esta a\u00e7\u00e3o.";

  const status = error.response?.status;
  if (!error.response || error.code === "ECONNABORTED")
    return "N\u00e3o foi poss\u00edvel conectar ao servidor. Confira sua conex\u00e3o e tente novamente.";

  const body = error.response.data;
  const rawMessage =
    body && typeof body === "object" && "message" in body
      ? (body as { message?: unknown }).message
      : undefined;
  const message = Array.isArray(rawMessage)
    ? rawMessage
        .filter((item): item is string => typeof item === "string")
        .join(" ")
    : typeof rawMessage === "string"
      ? rawMessage.trim()
      : "";

  if (message && isPortugueseMessage(message)) return message;
  if (message) {
    const translated = translateCommonApiMessage(message, status);
    if (translated) return translated;
  }

  if (status === 400 || status === 422)
    return "Confira os dados informados e tente novamente.";
  if (status === 404) return "O item solicitado n\u00e3o foi encontrado.";
  if (status === 409) return "J\u00e1 existe um cadastro com esses dados.";
  if (status === 429)
    return "Muitas tentativas em pouco tempo. Aguarde um momento e tente novamente.";
  if (status && status >= 500)
    return "O servidor apresentou um problema. Tente novamente em instantes.";
  return fallback;
}

function isPortugueseMessage(message: string): boolean {
  return /[\u00e1\u00e0\u00e2\u00e3\u00e9\u00ea\u00ed\u00f3\u00f4\u00f5\u00fa\u00e7]|\b(erro|produto|pre\u00e7o|informe|n\u00e3o|inv\u00e1lido|inv\u00e1lida|obrigat\u00f3rio|obrigat\u00f3ria|encontrado|encontrada|permiss\u00e3o|sess\u00e3o)\b/i.test(
    message,
  );
}

function translateCommonApiMessage(
  message: string,
  status?: number,
): string | null {
  const normalized = message.toLowerCase();
  if (
    normalized.includes("price") &&
    (normalized.includes("number") || normalized.includes("numeric"))
  )
    return "O pre\u00e7o deve ser informado como um n\u00famero v\u00e1lido.";
  if (
    /network error|failed to fetch|request timeout|timed out/.test(normalized)
  )
    return "N\u00e3o foi poss\u00edvel conectar ao servidor. Confira sua conex\u00e3o e tente novamente.";
  if (/not found|does not exist|was not found/.test(normalized))
    return "O item solicitado n\u00e3o foi encontrado.";
  if (
    /already exists|already in use|duplicate|unique constraint/.test(normalized)
  )
    return "J\u00e1 existe um cadastro com esses dados.";
  if (
    /must be|should be|is required|are required|invalid|validation failed/.test(
      normalized,
    )
  )
    return "Confira os dados informados e tente novamente.";
  if (status && status >= 500)
    return "O servidor apresentou um problema. Tente novamente em instantes.";
  return null;
}
