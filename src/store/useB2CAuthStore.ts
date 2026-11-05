import { create } from "zustand";

export const B2C_TOKEN_KEY = "@smartbiz:b2c_token";

type B2CAuthState = {
  token: string | null;
  hydrated: boolean;
  sessionVersion: number;
  message: string | null;
  hydrate: () => void;
  setToken: (token: string) => boolean;
  clearSession: (message?: string) => void;
  syncToken: (token: string | null) => void;
};

export const useB2CAuthStore = create<B2CAuthState>((set, get) => ({
  token: null,
  hydrated: false,
  sessionVersion: 0,
  message: null,
  hydrate: () => {
    if (typeof window === "undefined" || get().hydrated) return;
    try {
      const token = window.localStorage.getItem(B2C_TOKEN_KEY)?.trim() || null;
      set((state) => ({
        token,
        hydrated: true,
        sessionVersion: state.sessionVersion + 1,
      }));
    } catch {
      set({
        hydrated: true,
        message:
          "Não foi possível acessar o armazenamento do navegador. Habilite-o para entrar.",
      });
    }
  },
  setToken: (value) => {
    const token = value.trim().replace(/^Bearer\s+/i, "");
    if (!token) return false;
    try {
      window.localStorage.setItem(B2C_TOKEN_KEY, token);
    } catch {
      set({
        message:
          "Não foi possível salvar o token no navegador. Habilite o armazenamento e tente novamente.",
      });
      return false;
    }
    set((state) => ({
      token,
      hydrated: true,
      message: null,
      sessionVersion: state.sessionVersion + 1,
    }));
    return true;
  },
  clearSession: (message) => {
    try {
      window.localStorage.removeItem(B2C_TOKEN_KEY);
    } catch {
      /* Clear memory even if storage is unavailable. */
    }
    set((state) => ({
      token: null,
      hydrated: true,
      message: message ?? null,
      sessionVersion: state.sessionVersion + 1,
    }));
  },
  syncToken: (value) => {
    const token = value?.trim() || null;
    if (token === get().token) return;
    set((state) => ({
      token,
      hydrated: true,
      message: null,
      sessionVersion: state.sessionVersion + 1,
    }));
  },
}));
