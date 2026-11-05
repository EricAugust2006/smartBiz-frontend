"use client";

import { useId, useRef } from "react";
import { CalendarDays, Gift, Loader2, Target } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/toaster";
import { useUpdateMissionStatus } from "@/hooks/use-missions";
import { getRequestErrorMessage } from "@/lib/axios";
import {
  formatMissionExpiration,
  formatMissionGoal,
  type Mission,
} from "@/lib/missions";

export function MissionCard({ mission }: { mission: Mission }) {
  const id = useId();
  const update = useUpdateMissionStatus();
  const lock = useRef(false);
  const { toast } = useToast();
  const active = mission.status === "ACTIVE";

  async function changeStatus(checked: boolean) {
    if (lock.current) return;
    lock.current = true;
    try {
      await update.mutateAsync({
        id: mission.id,
        status: checked ? "ACTIVE" : "INACTIVE",
      });
      toast({
        title: checked ? "Missão ativada!" : "Missão desativada!",
        description: mission.name,
      });
    } catch {
      // The checked value comes from the confirmed cache; failures keep it intact.
    } finally {
      lock.current = false;
    }
  }

  return (
    <Card
      role="article"
      aria-labelledby={`${id}-title`}
      className="flex min-w-0 flex-col"
    >
      <CardHeader className="pb-4">
        <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
          <Target size={16} aria-hidden="true" />
          {mission.goalType === "VISITS" ? "Por visitas" : "Por valor gasto"}
        </div>
        <CardTitle id={`${id}-title`} className="break-words text-lg">
          {mission.name}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-5">
        <div>
          <p className="text-xs font-medium text-muted-foreground">Objetivo</p>
          <p className="mt-1 break-words text-2xl font-semibold tracking-tight tabular-nums">
            {formatMissionGoal(mission)}
          </p>
        </div>
        <div className="flex gap-3 rounded-xl bg-muted p-3">
          <Gift
            size={18}
            className="mt-0.5 shrink-0 text-primary-text"
            aria-hidden="true"
          />
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">Recompensa</p>
            <p className="mt-1 break-words text-sm font-medium">
              {mission.reward}
            </p>
          </div>
        </div>
        <p className="flex items-center gap-2 text-xs text-muted-foreground">
          <CalendarDays size={14} aria-hidden="true" />
          {formatMissionExpiration(mission.expiresAt)}
        </p>
        <div className="mt-auto flex min-h-12 items-center justify-between gap-3 border-t border-border pt-4">
          <Label
            htmlFor={`${id}-status`}
            className="flex items-center gap-2 text-sm"
          >
            {update.isPending ? (
              <>
                <Loader2
                  size={14}
                  className="animate-spin"
                  aria-hidden="true"
                />
                <span role="status">Salvando status…</span>
              </>
            ) : active ? (
              "Ativa"
            ) : (
              "Inativa"
            )}
          </Label>
          <Switch
            id={`${id}-status`}
            aria-label={`Status da missão ${mission.name}`}
            checked={active}
            disabled={update.isPending}
            aria-busy={update.isPending}
            onCheckedChange={(checked) => {
              void changeStatus(checked);
            }}
          />
        </div>
        {update.isError && (
          <div className="space-y-1">
            <p role="alert" className="text-sm text-destructive">
              {getRequestErrorMessage(
                update.error,
                "Não foi possível alterar o status. O estado anterior foi mantido.",
              )}
            </p>
            <Button
              type="button"
              variant="ghost"
              className="h-10 px-0 text-primary-text"
              aria-label={`Tentar alterar status de ${mission.name}`}
              onClick={() => {
                void changeStatus(!active);
              }}
            >
              Tentar novamente
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
