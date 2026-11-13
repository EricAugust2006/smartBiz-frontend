"use client";

import { useEffect, useState, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeScope } from "@/components/ui";
import { B2B_SESSION_KEY, useAuthStore } from "@/store/useAuthStore";
import { THEME_STORAGE_KEY, useThemeStore } from "@/store/useThemeStore";

function SessionProviders({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { refetchOnWindowFocus: false },
          mutations: { retry: false },
        },
      }),
  );

  useEffect(
    () => () => {
      queryClient.clear();
    },
    [queryClient],
  );

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

export function AppProviders({ children }: { children: ReactNode }) {
  const version = useAuthStore((state) => state.sessionVersion);
  const tenantId = useAuthStore((state) => state.tenant?.id);

  useEffect(() => {
    useAuthStore.getState().hydrate();
    useThemeStore.getState().hydrate();
    const onStorage = (event: StorageEvent) => {
      if (event.storageArea !== window.localStorage) return;
      if (event.key === B2B_SESSION_KEY || event.key === null) {
        useAuthStore
          .getState()
          .syncSession(event.key === null ? null : event.newValue);
      }
      if (event.key === THEME_STORAGE_KEY || event.key === null)
        useThemeStore.getState().sync();
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  return (
    <ThemeScope>
      {/* A new session/tenant gets a fresh cache and clears pending form state. */}
      <SessionProviders key={`${version}:${tenantId ?? ""}`}>
        {children}
      </SessionProviders>
    </ThemeScope>
  );
}
