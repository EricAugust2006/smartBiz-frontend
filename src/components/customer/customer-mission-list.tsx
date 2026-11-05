"use client";

import { useId } from "react";
import { CheckCircle2, Coffee, Gift, ShoppingBag, Target } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  formatCustomerMissionProgress,
  formatCustomerMissionRemaining,
  type CustomerMission,
} from "@/lib/customer-dashboard";

function CustomerMissionCard({ mission }: { mission: CustomerMission }) {
  const id = useId();
  const complete = mission.isCompleted;
  const Icon = mission.goalType === "VISITS" ? Coffee : ShoppingBag;
  const progressLabel = formatCustomerMissionProgress(mission);

  return (
    <Card role="article" aria-labelledby={`${id}-title`}>
      <CardHeader className="p-5 pb-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary-text">
            <Icon size={21} aria-hidden="true" />
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
            {complete ? (
              <>
                <CheckCircle2 size={13} aria-hidden="true" />
                Concluída
              </>
            ) : (
              "Em andamento"
            )}
          </span>
        </div>
        <CardTitle id={`${id}-title`} className="break-words text-base">
          {mission.name}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 p-5 pt-0">
        <div className="space-y-2.5">
          <p className="text-sm font-medium tabular-nums">{progressLabel}</p>
          <Progress
            aria-label={`Progresso de ${mission.name}`}
            aria-valuetext={progressLabel}
            value={mission.currentProgress}
            max={mission.targetValue}
          />
          <p
            className={
              complete
                ? "text-xs font-medium text-primary-text"
                : "text-xs text-muted-foreground"
            }
          >
            {formatCustomerMissionRemaining(mission)}
          </p>
        </div>
        <div className="flex items-start gap-2.5 border-t border-border pt-4">
          <Gift
            size={17}
            className="mt-0.5 shrink-0 text-primary-text"
            aria-hidden="true"
          />
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">Sua recompensa</p>
            <p className="mt-1 break-words text-sm font-medium">
              {mission.reward}
            </p>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          {mission.expiresAt === null
            ? "Sem expiração"
            : `Expira em ${new Intl.DateTimeFormat("pt-BR").format(new Date(mission.expiresAt))}`}
        </p>
      </CardContent>
    </Card>
  );
}

export function CustomerMissionList({
  missions,
}: {
  missions: CustomerMission[];
}) {
  return (
    <section
      id="missoes"
      aria-labelledby="customer-missions-title"
      className="scroll-mt-24 space-y-4"
    >
      <header className="flex items-center justify-between gap-3">
        <div>
          <h2
            id="customer-missions-title"
            className="text-lg font-semibold tracking-tight"
          >
            Missões ativas
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Pequenos passos, boas recompensas.
          </p>
        </div>
        <span
          aria-label={`${missions.length} missões disponíveis`}
          className="flex h-8 min-w-8 items-center justify-center rounded-full bg-primary-soft px-2 text-xs font-semibold text-primary-text"
        >
          {missions.length}
        </span>
      </header>
      {missions.length > 0 ? (
        <div className="space-y-4">
          {missions.map((mission) => (
            <CustomerMissionCard key={mission.id} mission={mission} />
          ))}
        </div>
      ) : (
        <Card className="flex flex-col items-center gap-3 p-6 text-center">
          <Target size={28} className="text-primary-text" aria-hidden="true" />
          <h3 className="text-sm font-semibold">
            Novas missões estão chegando
          </h3>
          <p className="text-sm text-muted-foreground">
            Enquanto isso, seus pontos continuam por aqui. Volte em breve para
            descobrir os próximos desafios.
          </p>
        </Card>
      )}
    </section>
  );
}
