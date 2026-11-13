"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ZodError } from "zod";
import { ChevronRight, QrCode, RefreshCw } from "lucide-react";
import { CustomerBalanceCard } from "@/components/customer/customer-balance-card";
import { CustomerMissionList } from "@/components/customer/customer-mission-list";
import { useCustomerIdentification } from "@/components/customer/customer-identification";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CustomerAppShell } from "@/components/customer/customer-app-shell";
import { CustomerDashboardSkeleton } from "@/components/customer/customer-dashboard-skeleton";
import { QrRedemptionScanner } from "@/components/customer/qr-redemption-scanner";
import { useB2CDashboard } from "@/hooks/use-b2c-dashboard";
import { getRequestErrorMessage } from "@/lib/axios";
import type { B2CDashboard } from "@/lib/customer-dashboard";
import { useB2CAuthStore } from "@/store/useB2CAuthStore";

function CustomerDashboardContent({ data }: { data: B2CDashboard }) {
  const { showIdentification } = useCustomerIdentification();

  return (
    <div id="inicio" className="scroll-mt-24 space-y-6">
      <CustomerBalanceCard
        customer={data.customer}
        pointsBalance={data.pointsBalance}
        completedMissions={
          data.missions.filter((mission) => mission.isCompleted).length
        }
        totalMissions={data.missions.length}
      />
      <div>
        <Button
          type="button"
          size="lg"
          aria-haspopup="dialog"
          onClick={(event) => showIdentification(event.currentTarget)}
          className="h-14 w-full justify-start rounded-2xl bg-primary text-primary-foreground shadow-card"
        >
          <QrCode size={23} className="shrink-0" aria-hidden="true" />
          <span className="flex-1 text-left text-base">Meu QR Code</span>
          <ChevronRight size={19} aria-hidden="true" />
        </Button>
        <p className="mt-2 text-center text-xs text-muted-foreground">
          Sua identificação no clube, em um toque.
        </p>
      </div>
      <QrRedemptionScanner />
      <CustomerMissionList missions={data.missions} />
    </div>
  );
}

export function CustomerDashboard() {
  const router = useRouter();
  const token = useB2CAuthStore((state) => state.token);
  const tenantSlug = useB2CAuthStore((state) => state.tenantSlug);
  const hydrated = useB2CAuthStore((state) => state.hydrated);
  const dashboard = useB2CDashboard();

  useEffect(() => {
    if (hydrated && !token) {
      router.replace(
        tenantSlug
          ? `/loja/${encodeURIComponent(tenantSlug)}`
          : "/cliente/dev-login",
      );
    }
  }, [hydrated, token, tenantSlug, router]);

  if (!hydrated || !token || dashboard.isPending) {
    return (
      <CustomerAppShell>
        <CustomerDashboardSkeleton />
      </CustomerAppShell>
    );
  }

  return (
    <CustomerAppShell
      customer={dashboard.data?.customer ?? null}
      showNavigation={Boolean(dashboard.data)}
    >
      {dashboard.isError && (
        <Card role="alert" className="mb-5 space-y-3 p-5">
          <h2 className="text-base font-semibold">
            Não foi possível atualizar seu dashboard
          </h2>
          <p className="text-sm text-destructive">
            {dashboard.error instanceof ZodError
              ? "O servidor retornou dados em um formato inesperado. Tente novamente."
              : getRequestErrorMessage(
                  dashboard.error,
                  "Verifique sua conexão e tente novamente.",
                )}
          </p>
          <Button
            variant="outline"
            disabled={dashboard.isFetching}
            onClick={() => {
              void dashboard.refetch();
            }}
          >
            Tentar novamente
          </Button>
          <Link
            href="/cliente/dev-login"
            className="block text-sm text-primary-text underline underline-offset-4"
          >
            Trocar token B2C
          </Link>
        </Card>
      )}
      {dashboard.data && (
        <>
          <div className="mb-3 flex justify-end">
            <Button
              type="button"
              variant="ghost"
              disabled={dashboard.isFetching}
              aria-label="Atualizar dashboard"
              onClick={() => {
                void dashboard.refetch();
              }}
            >
              <RefreshCw
                size={15}
                className={dashboard.isFetching ? "animate-spin" : undefined}
                aria-hidden="true"
              />
              Atualizar
            </Button>
          </div>
          <CustomerDashboardContent data={dashboard.data} />
        </>
      )}
    </CustomerAppShell>
  );
}
