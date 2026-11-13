"use client";

import { useEffect, useState, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  B2C_TENANT_SLUG_KEY,
  B2C_TOKEN_KEY,
  useB2CAuthStore,
} from "@/store/useB2CAuthStore";

function B2CQuerySession({ children }: { children: ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: false,
            staleTime: 30_000,
            refetchOnWindowFocus: true,
          },
        },
      }),
  );
  useEffect(
    () => () => {
      client.clear();
    },
    [client],
  );
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

export function B2CProviders({ children }: { children: ReactNode }) {
  const version = useB2CAuthStore((state) => state.sessionVersion);
  useEffect(() => {
    useB2CAuthStore.getState().hydrate();
    const onStorage = (event: StorageEvent) => {
      if (
        event.storageArea === window.localStorage &&
        (event.key === B2C_TOKEN_KEY ||
          event.key === B2C_TENANT_SLUG_KEY ||
          event.key === null)
      ) {
        const store = useB2CAuthStore.getState();
        if (event.key === B2C_TOKEN_KEY || event.key === null)
          store.syncToken(
            event.key === null
              ? window.localStorage.getItem(B2C_TOKEN_KEY)
              : event.newValue,
          );
        if (event.key === B2C_TENANT_SLUG_KEY || event.key === null)
          store.syncTenantSlug(
            event.key === null
              ? window.localStorage.getItem(B2C_TENANT_SLUG_KEY)
              : event.newValue,
          );
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);
  // Changing the token remounts the customer UI and disposes of the previous cache.
  return <B2CQuerySession key={version}>{children}</B2CQuerySession>;
}
