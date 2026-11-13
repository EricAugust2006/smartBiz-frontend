"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Check, RotateCcw, Save, SwatchBook } from "lucide-react";
import { Badge, Button, Card, Field, Input, cn } from "@/components/ui";
import { DEFAULT_THEME_COLORS, THEME_TARGETS, useThemeStore, type ThemeColors, type ThemeTarget } from "@/store/useThemeStore";
import { normalizeHex } from "@/theme/color";

const PALETTE = ["#0474C4", "#5379AE", "#2C444C", "#A8C4EC", "#06457F", "#262B40"];

export default function BrandSettings() {
  const colors = useThemeStore((state) => state.colors);
  const setColors = useThemeStore((state) => state.setColors);
  const [target, setTarget] = useState<ThemeTarget>("primary");
  const [draftColors, setDraftColors] = useState<ThemeColors>(colors);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  useEffect(() => setDraftColors(colors), [colors]);
  const selectedTarget = THEME_TARGETS.find((item) => item.id === target) ?? THEME_TARGETS[0];
  const currentColor = draftColors[target];
  const pickerColor = normalizeHex(currentColor) ?? colors[target];
  const hasChanges = THEME_TARGETS.some((item) => draftColors[item.id] !== colors[item.id]);

  const updateDraft = (hex: string) => {
    setDraftColors((previous) => ({ ...previous, [target]: hex }));
    setError("");
    setMessage("");
  };

  const saveChanges = () => {
    const normalized = Object.fromEntries(THEME_TARGETS.map(({ id, label }) => {
      const hex = normalizeHex(draftColors[id]);
      if (!hex) setError(`Informe uma cor hexadecimal válida para ${label}.`);
      return [id, hex];
    }));
    if (Object.values(normalized).some((hex) => hex === null)) return;
    setColors(normalized as ThemeColors);
    setError("");
    setMessage("Alterações salvas com sucesso.");
  };

  const restoreDefaults = () => {
    setDraftColors({ ...DEFAULT_THEME_COLORS });
    setError("");
    setMessage("Paleta padrão carregada. Salve para aplicar as alterações.");
  };

  return (
    <div className="mx-auto w-full max-w-6xl py-2 sm:py-4">
      <div className="mb-7 flex flex-wrap items-end justify-between gap-4 border-b border-border pb-5">
        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">Painel / Configurações</p>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-[28px]">Configuração de tema</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">Gerencie as cores e a identidade visual da sua loja.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {hasChanges && <Badge tone="warning">Alterações não salvas</Badge>}
          <Link href="/painel" className="inline-flex h-10 items-center gap-2 rounded-lg border border-border bg-card px-3.5 text-sm font-medium text-foreground shadow-xs outline-none transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"><ArrowLeft size={16} />Voltar ao painel</Link>
        </div>
      </div>
      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1.35fr)_minmax(300px,0.8fr)] xl:gap-6">
        <Card className="overflow-hidden">
          <div className="border-b border-border px-6 py-5">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-soft text-primary-text"><SwatchBook size={19} /></span>
              <div>
                <h2 className="text-[15px] font-semibold">Cores da marca</h2>
                <p className="mt-1 text-sm text-muted-foreground">Personalize as cores e salve quando terminar.</p>
              </div>
            </div>
          </div>
          <div className="space-y-7 px-6 py-6">
            <Field id="theme-target" label="O que deseja personalizar?" hint="Escolha a área que receberá a nova cor.">
              <select
                id="theme-target"
                value={target}
                onChange={(event) => setTarget(event.target.value as ThemeTarget)}
                className="h-10 w-full rounded-lg border border-input bg-card px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {THEME_TARGETS.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
              </select>
            </Field>

            <div className="max-w-md">
              <Field id="theme-color" label={`Cor: ${selectedTarget.label}`} hint="Escolha uma cor ou informe seu código hexadecimal.">
                <div className="flex items-center gap-3">
                  <label className="relative h-11 w-12 shrink-0 cursor-pointer overflow-hidden rounded-lg border border-input shadow-xs" style={{ backgroundColor: pickerColor }}>
                    <span className="sr-only">Abrir seletor de cores</span>
                    <input id="theme-color" type="color" value={pickerColor} onChange={(event) => updateDraft(event.target.value)} className="absolute inset-0 h-full w-full cursor-pointer opacity-0" />
                  </label>
                  <Input aria-label="Código hexadecimal" value={currentColor.toUpperCase()} onChange={(event) => updateDraft(event.target.value)} className="font-mono uppercase" />
                </div>
              </Field>
            </div>

            <fieldset>
              <legend className="mb-3 text-[13px] font-medium">Paleta SmartBiz</legend>
              <div className="flex flex-wrap gap-3">
                {PALETTE.map((hex) => {
                  const selected = currentColor.toLowerCase() === hex.toLowerCase();
                  return (
                    <button key={hex} type="button" aria-label={`Aplicar ${hex} em ${selectedTarget.label}`} aria-pressed={selected} onClick={() => updateDraft(hex)} className={cn("flex h-12 w-12 items-center justify-center rounded-xl border-2 outline-none transition focus-visible:ring-2 focus-visible:ring-ring", selected ? "border-foreground" : "border-transparent hover:border-border")}>
                      <span className="flex h-9 w-9 items-center justify-center rounded-lg shadow-xs" style={{ backgroundColor: hex }}>{selected && <Check size={17} className={hex === "#A8C4EC" ? "text-foreground" : "text-white"} />}</span>
                    </button>
                  );
                })}
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {PALETTE.map((hex) => <Badge key={hex} tone="neutral" className="font-mono">{hex}</Badge>)}
              </div>
            </fieldset>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-5">
              <div className="min-h-10 text-[13px]">
                {error ? <p role="alert" className="text-destructive">{error}</p> : message ? <p role="status" className="text-success">{message}</p> : <p className="text-muted-foreground">As cores só são aplicadas ao painel depois de salvar.</p>}
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" onClick={restoreDefaults}><RotateCcw size={15} /> Restaurar padrão</Button>
                <Button onClick={saveChanges} disabled={!hasChanges}><Save size={15} /> Salvar alterações</Button>
              </div>
            </div>
          </div>
        </Card>

        <Card className="overflow-hidden">
          <div className="border-b border-border px-5 py-4">
            <h2 className="text-sm font-semibold">Prévia do painel</h2>
            <p className="mt-1 text-xs text-muted-foreground">Visualização das cores selecionadas</p>
          </div>
          <div className="p-4">
            <div className="overflow-hidden rounded-xl border border-border shadow-xs">
              <div className="flex min-h-48">
                <div className="w-20 shrink-0 p-3" style={{ backgroundColor: draftColors.sidebar }}>
                  <div className="mb-5 h-6 w-6 rounded-md" style={{ backgroundColor: draftColors.primary }} />
                  {[0, 1, 2, 3].map((item) => <div key={item} className={cn("mb-2 h-2 rounded-full", item === 0 ? "bg-white/90" : "bg-white/30")} />)}
                </div>
                <div className="min-w-0 flex-1" style={{ color: draftColors.text }}>
                  <div className="flex h-11 items-center border-b border-border px-3" style={{ backgroundColor: draftColors.header }}><span className="h-2 w-20 rounded-full bg-current opacity-30" /></div>
                  <div className="space-y-3 bg-background p-3">
                    <div className="h-14 rounded-lg border border-border bg-card shadow-xs" />
                    <div className="h-12 rounded-lg border border-border bg-card shadow-xs" />
                    <button type="button" tabIndex={-1} className="rounded-lg px-3 py-2 text-xs font-medium text-white" style={{ backgroundColor: draftColors.primary }}>Botão primário</button>
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
              {THEME_TARGETS.map((item) => <div key={item.id} className="flex min-w-0 items-center gap-2 rounded-lg bg-muted p-2"><span className="h-4 w-4 shrink-0 rounded" style={{ backgroundColor: draftColors[item.id] }} /><span className="truncate text-muted-foreground">{item.label}</span></div>)}
            </div>
            <div className="mt-4 rounded-lg bg-primary-soft p-3 text-xs text-primary-text">Padrões iniciais disponíveis: {Object.keys(DEFAULT_THEME_COLORS).length} áreas.</div>
          </div>
        </Card>
      </div>
    </div>
  );
}
