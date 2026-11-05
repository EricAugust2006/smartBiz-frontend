"use client";

import { useId, useRef } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from "@/components/ui/sheet";
import { useToast } from "@/components/ui/toaster";
import { useCreateMission } from "@/hooks/use-missions";
import { getRequestErrorMessage } from "@/lib/axios";
import {
  missionFormSchema,
  type CreateMissionInput,
  type MissionFormInput,
} from "@/lib/missions";

const defaultValues: MissionFormInput = {
  name: "",
  goalType: "VISITS",
  targetValue: "",
  reward: "",
};

function FieldError({ id, message }: { id: string; message?: string }) {
  return message ? (
    <p id={id} role="alert" className="text-sm text-destructive">
      {message}
    </p>
  ) : null;
}

export function MissionFormSheet({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const id = useId();
  const create = useCreateMission();
  const { toast } = useToast();
  const lock = useRef(false);
  const form = useForm<MissionFormInput, unknown, CreateMissionInput>({
    resolver: zodResolver(missionFormSchema),
    defaultValues,
    mode: "onTouched",
  });
  const goalType = useWatch({ control: form.control, name: "goalType" });
  const busy = create.isPending || form.formState.isSubmitting;
  const errors = form.formState.errors;

  function handleOpenChange(next: boolean) {
    if (busy) return;
    if (!next) {
      form.reset(defaultValues);
      create.reset();
    }
    onOpenChange(next);
  }

  async function onSubmit(values: CreateMissionInput) {
    if (lock.current) return;
    lock.current = true;
    try {
      await create.mutateAsync(values);
      form.reset(defaultValues);
      onOpenChange(false);
      toast({
        title: "Missão criada!",
        description: `${values.name} já pode fazer parte do programa de fidelidade.`,
      });
    } catch {
      // Keep the sheet open and preserve all fields for a manual retry.
    } finally {
      lock.current = false;
    }
  }

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent
        side="right"
        closeLabel="Fechar formulário"
        closeDisabled={busy}
        className="flex flex-col overflow-y-auto p-0"
      >
        <header className="border-b border-border px-6 pb-6 pt-8 pr-14">
          <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-primary-soft text-primary-text">
            <Plus size={22} aria-hidden="true" />
          </div>
          <SheetTitle className="text-xl font-semibold tracking-tight">
            Nova Missão
          </SheetTitle>
          <SheetDescription className="mt-2 text-sm text-muted-foreground">
            Defina o objetivo e a recompensa que vão trazer seus clientes de
            volta.
          </SheetDescription>
        </header>

        <form
          onSubmit={form.handleSubmit(onSubmit)}
          noValidate
          aria-busy={busy}
          className="flex flex-1 flex-col"
        >
          <fieldset disabled={busy} className="space-y-6 p-6">
            <div className="space-y-2">
              <Label htmlFor={`${id}-name`}>Nome da Missão</Label>
              <Input
                id={`${id}-name`}
                placeholder="Ex.: Fã de Carteirinha"
                autoComplete="off"
                {...form.register("name")}
                aria-invalid={Boolean(errors.name)}
                aria-describedby={errors.name ? `${id}-name-error` : undefined}
              />
              <FieldError
                id={`${id}-name-error`}
                message={errors.name?.message}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor={`${id}-goal-type`}>Tipo de Meta</Label>
              <Controller
                name="goalType"
                control={form.control}
                render={({ field }) => (
                  <Select
                    value={field.value}
                    disabled={busy}
                    onValueChange={(value) => {
                      field.onChange(value);
                      if (form.getValues("targetValue"))
                        void form.trigger("targetValue");
                    }}
                  >
                    <SelectTrigger
                      id={`${id}-goal-type`}
                      ref={field.ref}
                      onBlur={field.onBlur}
                      aria-invalid={Boolean(errors.goalType)}
                      aria-describedby={
                        errors.goalType ? `${id}-goal-type-error` : undefined
                      }
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="VISITS">Por Visitas</SelectItem>
                      <SelectItem value="AMOUNT">Por Valor Gasto</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              <FieldError
                id={`${id}-goal-type-error`}
                message={errors.goalType?.message}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor={`${id}-target`}>
                Objetivo{goalType === "AMOUNT" ? " (R$)" : ""}
              </Label>
              <Input
                id={`${id}-target`}
                type="number"
                inputMode={goalType === "VISITS" ? "numeric" : "decimal"}
                min={goalType === "VISITS" ? 1 : 0.01}
                step={goalType === "VISITS" ? 1 : 0.01}
                placeholder={goalType === "VISITS" ? "Ex.: 3" : "Ex.: 150,00"}
                {...form.register("targetValue")}
                aria-invalid={Boolean(errors.targetValue)}
                aria-describedby={`${id}-target-hint${errors.targetValue ? ` ${id}-target-error` : ""}`}
              />
              <p
                id={`${id}-target-hint`}
                className="text-xs text-muted-foreground"
              >
                {goalType === "VISITS"
                  ? "Número inteiro de visitas, a partir de 1."
                  : "Valor total em reais, a partir de R$ 0,01 e com até duas casas decimais."}
              </p>
              <FieldError
                id={`${id}-target-error`}
                message={errors.targetValue?.message}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor={`${id}-reward`}>Recompensa</Label>
              <Input
                id={`${id}-reward`}
                placeholder="Ex.: 1 Café e 1 Croissant"
                autoComplete="off"
                {...form.register("reward")}
                aria-invalid={Boolean(errors.reward)}
                aria-describedby={
                  errors.reward ? `${id}-reward-error` : undefined
                }
              />
              <FieldError
                id={`${id}-reward-error`}
                message={errors.reward?.message}
              />
            </div>

            <p className="rounded-xl bg-muted p-3 text-sm text-muted-foreground">
              Missão permanente · Sem expiração.
            </p>
          </fieldset>

          {create.isError && (
            <p
              role="alert"
              className="mx-6 mb-6 rounded-xl border border-destructive/30 bg-destructive-soft p-3 text-sm text-destructive"
            >
              {getRequestErrorMessage(
                create.error,
                "Não foi possível criar a missão. Confira sua conexão e tente novamente; seus dados foram mantidos.",
              )}
            </p>
          )}

          <footer className="mt-auto flex flex-wrap justify-end gap-3 border-t border-border p-6">
            <Button
              type="button"
              variant="outline"
              disabled={busy}
              onClick={() => handleOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={busy}
              className="bg-primary text-primary-foreground"
            >
              {busy && (
                <Loader2
                  size={16}
                  className="animate-spin"
                  aria-hidden="true"
                />
              )}
              {busy ? "Salvando missão…" : "Salvar Missão"}
            </Button>
          </footer>
        </form>
      </SheetContent>
    </Sheet>
  );
}
