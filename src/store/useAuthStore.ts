import { create } from "zustand";
import {
  authResponseSchema,
  storedB2BSessionSchema,
  type AuthResponse,
  type AuthUser,
  type AuthTenant,
} from "@/lib/auth";

export const B2B_SESSION_KEY = "smartbiz.session";

type AuthState = {
  accessToken: string | null;
  user: AuthUser | null;
  tenant: AuthTenant | null;
  hydrated: boolean;
  tenantVerified: boolean;
  sessionVersion: number;
  message: string | null;
  hydrate: () => void;
  syncSession: (raw: string | null) => void;
  setSession: (session: AuthResponse) => boolean;
  setTenant: (tenant: AuthTenant) => void;
  clearSession: (message?: string) => void;
};

const emptySession = {
  accessToken: null,
  user: null,
  tenant: null,
  tenantVerified: false,
};

export const useAuthStore = create<AuthState>((set, get) => ({
  ...emptySession,
  hydrated: false,
  sessionVersion: 0,
  message: null,
  hydrate: () => {
    if (typeof window === "undefined" || get().hydrated) return;
    try {
      get().syncSession(window.localStorage.getItem(B2B_SESSION_KEY));
    } catch {
      set({
        ...emptySession,
        hydrated: true,
        message:
          "Não foi possível acessar a sessão no navegador. Habilite o armazenamento para entrar.",
      });
    }
  },
  syncSession: (raw) => {
    let session: ReturnType<typeof storedB2BSessionSchema.parse> | null = null;
    if (raw) {
      try {
        const parsed = storedB2BSessionSchema.safeParse(
          JSON.parse(raw) as unknown,
        );
        if (parsed.success) session = parsed.data;
        else {
          try {
            window.localStorage.removeItem(B2B_SESSION_KEY);
          } catch {
            /* Session still clears in memory. */
          }
        }
      } catch {
        try {
          window.localStorage.removeItem(B2B_SESSION_KEY);
        } catch {
          /* Session still clears in memory. */
        }
      }
    }
    set((state) => ({
      ...(session ? { ...session, tenantVerified: true } : emptySession),
      hydrated: true,
      sessionVersion: state.sessionVersion + 1,
      message: null,
    }));
  },
  setSession: (response) => {
    const parsed = authResponseSchema.safeParse(response);
    if (!parsed.success) {
      set({ message: "O servidor retornou uma sessão inválida." });
      return false;
    }
    const { access_token: accessToken, user, tenant } = parsed.data;
    const session = { accessToken, user, tenant };
    try {
      window.localStorage.setItem(B2B_SESSION_KEY, JSON.stringify(session));
    } catch {
      set({
        message:
          "Não foi possível salvar a sessão no navegador. Habilite o armazenamento e entre novamente.",
      });
      return false;
    }
    set((state) => ({
      ...session,
      hydrated: true,
      tenantVerified: true,
      sessionVersion: state.sessionVersion + 1,
      message: null,
    }));
    return true;
  },
  setTenant: (tenant) => {
    const { accessToken, user } = get();
    if (!accessToken || !user) return;
    try {
      window.localStorage.setItem(
        B2B_SESSION_KEY,
        JSON.stringify({ accessToken, user, tenant }),
      );
    } catch {
      /* Keep the verified tenant in memory. */
    }
    set({ tenant, tenantVerified: true });
  },
  clearSession: (message) => {
    try {
      window.localStorage.removeItem(B2B_SESSION_KEY);
    } catch {
      /* Logout also works with blocked storage. */
    }
    set((state) => ({
      ...emptySession,
      hydrated: true,
      sessionVersion: state.sessionVersion + 1,
      message: message ?? null,
    }));
  },
}));
