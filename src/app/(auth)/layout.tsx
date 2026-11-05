import type { ReactNode } from "react";
import { AppProviders } from "@/components/providers/app-providers";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <AppProviders>
      <main className="flex min-h-dvh items-center justify-center px-4 py-10 sm:px-6">
        <div className="w-full max-w-md">{children}</div>
      </main>
    </AppProviders>
  );
}
