"use client";

import { Sparkles, Trophy } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { customerPointsFormatter } from "@/lib/customer-dashboard";
import type { B2CCustomer } from "@/lib/customer-dashboard";

export function CustomerBalanceCard({
  customer,
  pointsBalance,
  completedMissions,
  totalMissions,
}: {
  customer: B2CCustomer;
  pointsBalance: number;
  completedMissions: number;
  totalMissions: number;
}) {
  return (
    <Card className="overflow-hidden">
      <div className="relative overflow-hidden bg-gradient-to-br from-primary to-primary-hover p-6 text-primary-foreground">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full border-[24px] border-primary-foreground/10"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-20 right-0 h-48 w-48 rounded-full border border-primary-foreground/10"
        />
        <div className="relative">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-foreground/10 px-3 py-1 text-xs font-medium">
            <Sparkles size={13} aria-hidden="true" />
            Cada visita vale mais
          </span>
          <h1 className="mt-5 break-words text-xl font-semibold tracking-tight">
            Olá, {customer.name}!
          </h1>
          <p className="mt-1 text-sm opacity-90">Que bom ter você por aqui.</p>
          <p className="mt-6 text-xs font-medium uppercase tracking-widest opacity-90">
            Seu saldo de pontos
          </p>
          <output
            aria-label="Saldo de pontos"
            className="mt-1 flex flex-wrap items-baseline gap-x-2 gap-y-1"
          >
            <span className="break-all text-6xl font-semibold leading-tight tracking-tight tabular-nums">
              {customerPointsFormatter.format(pointsBalance)}
            </span>
            <span className="text-sm font-medium">pontos</span>
          </output>
        </div>
      </div>
      <div className="space-y-3 p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="inline-flex items-center gap-2 text-sm font-semibold text-primary-text">
            <Trophy size={17} aria-hidden="true" />
            Suas conquistas
          </span>
          <span className="text-xs text-muted-foreground">
            {completedMissions} de {totalMissions} concluídas
          </span>
        </div>
        {totalMissions > 0 && (
          <Progress
            aria-label="Progresso das missões"
            value={completedMissions}
            max={totalMissions}
            className="bg-primary-soft"
          />
        )}
        <p className="text-xs leading-relaxed text-muted-foreground">
          {totalMissions === 0
            ? "Novos desafios vão aparecer por aqui. Seus pontos continuam disponíveis."
            : completedMissions === totalMissions
              ? "Você completou todos os desafios disponíveis. Aproveite suas conquistas!"
              : "Cada missão concluída é um novo motivo para comemorar."}
        </p>
      </div>
    </Card>
  );
}
