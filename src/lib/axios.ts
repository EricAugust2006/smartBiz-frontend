import axios from "axios";
import { useAuthStore } from "@/store/useAuthStore";
import { useB2CAuthStore } from "@/store/useB2CAuthStore";

export const api = axios.create({
  baseURL: (process.env.NEXT_PUBLIC_API_URL?.trim() || "http://localhost:3000").replace(
    /\/+$/,
    "",
  ),
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
  if (token) config.headers.set("Authorization", `Bearer ${token}`);
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
    return "Sua sessão expirou. Entre novamente para continuar.";
  if (error.response?.status === 403)
    return "Sua conta não tem permissão para realizar esta ação.";
  return fallback;
}
