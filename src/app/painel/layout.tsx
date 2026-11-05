import type { ReactNode } from "react";
import { AppPanelShell } from "@/components/layout/app-panel-shell";
import { AppProviders } from "@/components/providers/app-providers";
import { ProtectedRoute } from "@/components/auth/protected-route";

export default function PanelLayout({ children }: { children: ReactNode }) {
  return (
    <AppProviders>
      <ProtectedRoute>
        <AppPanelShell>{children}</AppPanelShell>
      </ProtectedRoute>
    </AppProviders>
  );
}
