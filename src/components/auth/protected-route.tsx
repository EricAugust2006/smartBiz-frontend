"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuthStore } from "@/store/useAuthStore";

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { hydrated, accessToken, user, tenant } = useAuthStore();
  const authenticated = Boolean(accessToken && user && tenant);

  useEffect(() => {
    if (hydrated && !authenticated) router.replace("/login");
  }, [hydrated, authenticated, router]);

  if (!hydrated || !authenticated) {
    return (
      <main
        aria-label="Carregando sessão"
        aria-busy="true"
        className="mx-auto max-w-2xl space-y-6 p-6"
      >
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-96 w-full rounded-2xl" />
        <span role="status" className="sr-only">
          Carregando sessão…
        </span>
      </main>
    );
  }
  return children;
}
