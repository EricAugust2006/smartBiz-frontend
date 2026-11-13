"use client";

import Link from "next/link";
import {
  ArrowRight,
  CircleDollarSign,
  PackageSearch,
  RefreshCw,
  ReceiptText,
  Target,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useDashboardMetrics } from "@/hooks/use-dashboard-metrics";
import { getRequestErrorMessage } from "@/lib/axios";
import {
  dashboardDateTimeFormatter,
  dashboardMoneyFormatter,
} from "@/lib/dashboard-metrics";

const shortcuts = [
  {
    href: "/painel/nova-venda",
    label: "Nova Venda",
    description: "Registrar uma compra no PDV",
    icon: ReceiptText,
  },
  {
    href: "/painel/produtos",
    label: "Produtos",
    description: "Gerenciar o catálogo da loja",
    icon: PackageSearch,
  },
  {
    href: "/painel/missoes",
    label: "Desafios",
    description: "Criar e acompanhar missões",
    icon: Target,
  },
] as const;

function DashboardSkeleton() {
  return (
    <div className="space-y-6" aria-label="Carregando painel" aria-busy="true">
      <span className="sr-only">Carregando métricas e vendas recentes…</span>
      <section
        className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-4"
        aria-label="Métricas"
      >
        {Array.from({ length: 4 }, (_, index) => (
          <Card key={index} aria-hidden="true">
            <CardContent className="space-y-4 p-5">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-8 w-40" />
              <Skeleton className="h-10 w-10 rounded-xl" />
            </CardContent>
          </Card>
        ))}
      </section>
      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(280px,0.8fr)]">
        <Card aria-hidden="true" className="p-5 sm:p-6">
          <Skeleton className="mb-6 h-6 w-44" />
          <div className="space-y-4">
            {[0, 1, 2].map((item) => (
              <div
                key={item}
                className="flex justify-between gap-4 border-b border-border pb-4"
              >
                <div className="space-y-2">
                  <Skeleton className="h-4 w-36" />
                  <Skeleton className="h-3 w-48" />
                </div>
                <Skeleton className="h-5 w-20" />
              </div>
            ))}
          </div>
        </Card>
        <Card aria-hidden="true" className="p-5 sm:p-6">
          <Skeleton className="mb-6 h-6 w-36" />
          <div className="space-y-3">
            {[0, 1, 2].map((item) => (
              <Skeleton key={item} className="h-20 w-full rounded-xl" />
            ))}
          </div>
        </Card>
      </section>
    </div>
  );
}

function MetricCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: typeof CircleDollarSign;
}) {
  return (
    <Card>
      <CardContent className="flex items-start justify-between gap-3 p-5">
        <div className="min-w-0">
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="mt-3 truncate text-2xl font-semibold tracking-tight tabular-nums">
            {value}
          </p>
        </div>
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary-text">
          <Icon size={19} aria-hidden="true" />
        </span>
      </CardContent>
    </Card>
  );
}

function QuickShortcutsCard() {
  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle>Atalhos rápidos</CardTitle>
        <p className="text-sm text-muted-foreground">
          Acesse as tarefas mais usadas no painel.
        </p>
      </CardHeader>
      <CardContent className="space-y-3 pt-0">
        {shortcuts.map(({ href, label, description, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="group flex min-h-20 items-center gap-3 rounded-xl border border-border bg-card p-4 outline-none transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary-text">
              <Icon size={19} aria-hidden="true" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold">{label}</span>
              <span className="mt-1 block text-xs text-muted-foreground">
                {description}
              </span>
            </span>
            <ArrowRight
              size={17}
              className="shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5"
              aria-hidden="true"
            />
          </Link>
        ))}
      </CardContent>
    </Card>
  );
}

export default function Dashboard() {
  return <DashboardContent />;
}

export function DashboardContent() {
  const metrics = useDashboardMetrics();
  const data = metrics.data;

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <header className="rounded-2xl border border-border bg-[var(--theme-header)] p-5 shadow-card sm:p-6">
        <p className="text-sm text-muted-foreground">Painel da loja</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">
          Visão geral
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Acompanhe os resultados e as vendas recentes da sua loja.
        </p>
      </header>

      {metrics.isLoading ? (
        <DashboardSkeleton />
      ) : (
        <>
          {metrics.isError && (
            <Card role="alert" className="p-5">
              <p className="text-sm text-destructive">
                {getRequestErrorMessage(
                  metrics.error,
                  data
                    ? "Não foi possível atualizar as métricas. Os últimos dados carregados foram mantidos."
                    : "Não foi possível carregar as métricas do painel. Confira sua conexão e tente novamente.",
                )}
              </p>
              <Button
                type="button"
                variant="outline"
                disabled={metrics.isFetching}
                onClick={() => void metrics.refetch()}
                className="mt-3"
              >
                <RefreshCw
                  size={16}
                  className={metrics.isFetching ? "animate-spin" : undefined}
                  aria-hidden="true"
                />
                Tentar novamente
              </Button>
            </Card>
          )}

          {data && (
            <>
              <section
                aria-label="Métricas da loja"
                className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-4"
              >
                <MetricCard
                  label="Receita Total"
                  value={dashboardMoneyFormatter.format(
                    Number(data.totalRevenue),
                  )}
                  icon={CircleDollarSign}
                />
                <MetricCard
                  label="Receita do Mês"
                  value={dashboardMoneyFormatter.format(
                    Number(data.monthlyRevenue),
                  )}
                  icon={CircleDollarSign}
                />
                <MetricCard
                  label="Total de Clientes"
                  value={data.totalCustomers.toLocaleString("pt-BR")}
                  icon={Users}
                />
                <MetricCard
                  label="Missões Ativas"
                  value={data.activeMissions.toLocaleString("pt-BR")}
                  icon={Target}
                />
              </section>

              <section className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(280px,0.8fr)]">
                <Card className="min-w-0">
                  <CardHeader className="flex-row items-center justify-between gap-3 pb-4">
                    <div>
                      <CardTitle>Vendas Recentes</CardTitle>
                      <p className="mt-1 text-sm text-muted-foreground">
                        As últimas vendas registradas na loja.
                      </p>
                    </div>
                    <ReceiptText
                      className="shrink-0 text-primary-text"
                      size={20}
                      aria-hidden="true"
                    />
                  </CardHeader>
                  <CardContent className="pt-0">
                    {data.recentSales.length ? (
                      <ol className="divide-y divide-border">
                        {data.recentSales.map((sale) => (
                          <li
                            key={sale.id}
                            className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 py-4 first:pt-1 last:pb-1"
                          >
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium">
                                {sale.customer?.name ?? "Cliente avulso"}
                              </p>
                              <p className="mt-1 truncate text-xs text-muted-foreground">
                                {sale.customer?.phone ?? "Sem telefone"} ·{" "}
                                {dashboardDateTimeFormatter.format(
                                  new Date(sale.createdAt),
                                )}
                              </p>
                            </div>
                            <span className="shrink-0 text-sm font-semibold tabular-nums">
                              {dashboardMoneyFormatter.format(
                                Number(sale.amount),
                              )}
                            </span>
                          </li>
                        ))}
                      </ol>
                    ) : (
                      <p className="py-10 text-center text-sm text-muted-foreground">
                        Nenhuma venda recente.
                      </p>
                    )}
                  </CardContent>
                </Card>

                <QuickShortcutsCard />
              </section>
            </>
          )}

          {!data && metrics.isError && <QuickShortcutsCard />}
        </>
      )}
    </div>
  );
}
