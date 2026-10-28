import { useEffect, useState } from "react";
import { Check, Gift, LayoutDashboard, Package } from "lucide-react";
import { DashboardLayout, PageHeader } from "../components/layout/DashboardLayout";
import { Badge, Button, Card, Field, Input, Progress, TenantMark, cn, toast } from "../components/ui";
import { BRAND_PRESETS, deriveBrand, normalizeHex } from "../theme/color";
import { useThemeStore } from "../store/useThemeStore";
import { customer, tenant } from "../data";
import { useScreenInit } from "../useScreenInit";

export default function BrandSettings() {
  const init = useScreenInit();
  const { brandHex, tokens, setBrand } = useThemeStore();
  const [custom, setCustom] = useState(typeof init.brand === "string" ? init.brand : brandHex);
  const [error, setError] = useState("");
  useEffect(() => {
    if (typeof init.brand === "string") setBrand(init.brand);
  }, [init.brand, setBrand]);

  const choose = (hex: string) => {
    const prev = brandHex;
    if (prev === hex) return;
    setBrand(hex);
    setCustom(hex);
    setError("");
    toast("Cor da marca atualizada", () => { setBrand(prev); setCustom(prev); });
  };

  const applyCustom = () => {
    const hex = normalizeHex(custom);
    if (!hex) {
      setError("Use um código hexadecimal, como #2563EB");
      return;
    }
    choose(hex);
  };

  const checks = [
    { label: "Texto sobre a cor principal", ratio: tokens.ratios.label, min: 4.5 },
    { label: "Links e destaques sobre branco", ratio: tokens.ratios.accent, min: 4.5 },
    { label: "Contorno de botões e campos", ratio: tokens.ratios.edge, min: 3 },
  ];

  return (
    <DashboardLayout>
      <PageHeader title="Configurações" />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <Card>
          <div className="border-b border-border px-6 py-5">
            <h2 className="text-[15px] font-semibold tracking-tight">Cor da marca</h2>
            <p className="mt-1 text-sm text-muted-foreground">Aplicada ao painel e ao app do cliente assim que você escolher</p>
          </div>

          <div className="flex flex-col gap-8 px-6 py-6">
            <fieldset>
              <legend className="mb-3 text-[13px] font-medium">Cores sugeridas</legend>
              <div role="radiogroup" className="grid grid-cols-3 gap-3 sm:grid-cols-6">
                {BRAND_PRESETS.map((p) => {
                  const selected = brandHex === p.hex;
                  return (
                    <button
                      key={p.id}
                      role="radio"
                      aria-checked={selected}
                      onClick={() => choose(p.hex)}
                      className={cn(
                        "flex cursor-pointer flex-col items-center gap-2 rounded-xl border p-3 outline-none focus-visible:ring-2 focus-visible:ring-ring",
                        selected ? "border-foreground bg-muted" : "border-border hover:bg-muted",
                      )}
                    >
                      <span
                        className="flex h-9 w-9 items-center justify-center rounded-full border border-input"
                        style={{ background: p.hex, color: deriveBrand(p.hex).fg }}
                      >
                        {selected && <Check size={16} strokeWidth={2.5} />}
                      </span>
                      <span className="text-[13px] font-medium">{p.name}</span>
                    </button>
                  );
                })}
              </div>
            </fieldset>

            <div className="max-w-sm">
              <Field id="hex" label="Cor personalizada" error={error} hint="Código hexadecimal da sua identidade visual">
                <div className="flex gap-2">
                  <label className="relative h-10 w-10 shrink-0 cursor-pointer overflow-hidden rounded-lg border border-input" style={{ background: normalizeHex(custom) ?? brandHex }}>
                    <span className="sr-only">Escolher no seletor</span>
                    <input type="color" value={normalizeHex(custom) ?? brandHex} onChange={(e) => { setCustom(e.target.value); choose(e.target.value); }} className="absolute inset-0 cursor-pointer opacity-0" />
                  </label>
                  <Input
                    id="hex"
                    value={custom}
                    invalid={!!error}
                    onChange={(e) => setCustom(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && applyCustom()}
                    className="font-mono uppercase"
                  />
                  <Button variant="outline" onClick={applyCustom}>Aplicar</Button>
                </div>
              </Field>
            </div>

            <div>
              <h3 className="text-[13px] font-medium">Contraste</h3>
              <ul className="mt-2 divide-y divide-border">
                {checks.map((c) => (
                  <li key={c.label} className="flex items-center justify-between gap-4 py-3 text-sm">
                    <span>{c.label}</span>
                    <span className="flex items-center gap-3">
                      <span className="font-mono text-[13px] text-muted-foreground tabular-nums">{c.ratio.toFixed(1)}:1</span>
                      <Badge tone={c.ratio >= c.min ? "success" : "danger"}>
                        {c.ratio >= c.min ? <><Check size={12} strokeWidth={2.5} />Legível</> : "Abaixo do mínimo"}
                      </Badge>
                    </span>
                  </li>
                ))}
              </ul>
              {tokens.isLight ? (
                <p className="mt-3 text-[13px] text-muted-foreground">
                  Com branco, botões ficam brancos com contorno escuro e os destaques usam preto para continuar legíveis
                </p>
              ) : tokens.textAdjusted ? (
                <p className="mt-3 text-[13px] text-muted-foreground">
                  Links e destaques usam um tom mais escuro, <span className="font-mono">{tokens.text.toUpperCase()}</span>, para continuar legíveis sobre branco
                </p>
              ) : null}
            </div>
          </div>
        </Card>

        <BrandPreview />
      </div>
    </DashboardLayout>
  );
}

function BrandPreview() {
  return (
    <div className="flex flex-col gap-4 xl:sticky xl:top-8 xl:self-start">
      <h2 className="text-[13px] font-medium text-muted-foreground">Prévia</h2>

      <Card className="p-5">
        <p className="mb-4 text-[13px] font-medium">Painel</p>
        <div className="flex flex-col gap-1">
          <div className="flex h-9 items-center gap-3 rounded-lg bg-primary-soft px-3 text-sm font-medium text-primary-text">
            <LayoutDashboard size={16} strokeWidth={1.75} /> Início
          </div>
          <div className="flex h-9 items-center gap-3 rounded-lg px-3 text-sm font-medium text-muted-foreground">
            <Package size={16} strokeWidth={1.75} /> Estoque
          </div>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-border pt-4">
          <Button size="sm" tabIndex={-1}>Criar promoção</Button>
          <Button size="sm" variant="outline" tabIndex={-1}>Ver estoque</Button>
          <span className="text-sm font-medium text-primary-text underline underline-offset-4">Ver todos</span>
        </div>
      </Card>

      <Card className="p-5">
        <p className="mb-4 text-[13px] font-medium">App do cliente</p>
        <div className="rounded-xl border border-primary-border bg-primary p-4 text-primary-foreground">
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-medium opacity-90">{tenant.name}</span>
            <Gift size={16} strokeWidth={1.75} />
          </div>
          <p className="mt-3 text-2xl font-semibold tracking-tight tabular-nums">{customer.points} pontos</p>
          <p className="text-[13px] opacity-90">Nível {customer.level}</p>
        </div>
        <div className="mt-4 flex items-center gap-3">
          <TenantMark size="sm" />
          <Progress value={3} max={5} />
          <span className="text-[13px] tabular-nums text-muted-foreground">3/5</span>
        </div>
      </Card>
    </div>
  );
}

