"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { Plus, RefreshCw, Target } from "lucide-react";
import { MissionCard } from "@/components/missions/mission-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { LoadingFeedback } from "@/components/ui/loading-feedback";
import { useMissions } from "@/hooks/use-missions";
import { getRequestErrorMessage } from "@/lib/axios";

const MissionFormSheet = dynamic(
  () =>
    import("@/components/missions/mission-form-sheet").then(
      (module) => module.MissionFormSheet,
    ),
  { loading: () => <LoadingFeedback /> },
);

function MissionsSkeleton() {
  return (
    <div
      role="status"
      aria-label="Carregando missões"
      aria-busy="true"
      className="grid gap-5 md:grid-cols-2 xl:grid-cols-3"
    >
      <span className="sr-only">Carregando missões…</span>
      {Array.from({ length: 6 }, (_, index) => (
        <Card key={index} aria-hidden="true">
          <CardHeader className="gap-3">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-6 w-4/5" />
          </CardHeader>
          <CardContent className="space-y-5">
            <Skeleton className="h-9 w-3/5" />
            <Skeleton className="h-20 w-full rounded-xl" />
            <Skeleton className="h-4 w-28" />
            <div className="flex justify-between border-t border-border pt-4">
              <Skeleton className="h-5 w-16" />
              <Skeleton className="h-6 w-11 rounded-full" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function MissionsManager() {
  const [open, setOpen] = useState(false);
  const missions = useMissions();
  const items = missions.data ?? [];
  const active = items.filter((mission) => mission.status === "ACTIVE").length;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-2xl">
          <p className="mb-1 text-sm text-muted-foreground">
            Programa de fidelidade
          </p>
          <h1 className="text-2xl font-semibold tracking-tight">
            Missões e Desafios
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Transforme visitas e compras em motivos para voltar à sua loja.
          </p>
          {missions.data && (
            <p className="mt-3 text-xs text-muted-foreground">
              {active} {active === 1 ? "ativa" : "ativas"} ·{" "}
              {items.length - active}{" "}
              {items.length - active === 1 ? "inativa" : "inativas"}
            </p>
          )}
        </div>
        <Button
          size="lg"
          onClick={() => setOpen(true)}
          className="bg-primary text-primary-foreground"
        >
          <Plus size={18} aria-hidden="true" />
          Nova Missão
        </Button>
      </header>

      {missions.isLoading ? (
        <div className="space-y-4">
          <LoadingFeedback />
          <MissionsSkeleton />
        </div>
      ) : (
        <>
          {missions.isError && missions.data && (
            <p role="status" className="text-xs text-muted-foreground">
              Não foi possível atualizar as missões agora. Exibindo os dados carregados anteriormente.
            </p>
          )}
          {missions.isError && !missions.data && (
            <Card role="alert" className="p-5">
              <p className="text-sm text-destructive">
                {getRequestErrorMessage(
                  missions.error,
                  "Não foi possível carregar as missões. Verifique sua conexão e tente novamente.",
                )}
              </p>
              <Button
                variant="outline"
                disabled={missions.isFetching}
                onClick={() => {
                  void missions.refetch();
                }}
                className="mt-3"
              >
                <RefreshCw
                  size={16}
                  className={missions.isFetching ? "animate-spin" : undefined}
                  aria-hidden="true"
                />
                Tentar novamente
              </Button>
            </Card>
          )}
          {items.length > 0 ? (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {items.map((mission) => (
                <MissionCard key={mission.id} mission={mission} />
              ))}
            </div>
          ) : (
            !missions.isError && (
              <Card className="flex flex-col items-center gap-4 px-6 py-14 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-soft text-primary-text">
                  <Target size={26} aria-hidden="true" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold">
                    Sua primeira missão começa aqui
                  </h2>
                  <p className="mt-2 max-w-md text-sm text-muted-foreground">
                    Crie um objetivo e ofereça uma recompensa para incentivar a
                    próxima visita.
                  </p>
                </div>
                <Button variant="outline" onClick={() => setOpen(true)}>
                  Criar primeira missão
                </Button>
              </Card>
            )
          )}
        </>
      )}
      {open && <MissionFormSheet open={open} onOpenChange={setOpen} />}
    </div>
  );
}
