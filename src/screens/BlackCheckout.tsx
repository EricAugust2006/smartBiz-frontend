import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { Check, ChevronLeft, CreditCard, Loader2, QrCode } from "lucide-react";
import { Button, ThemeScope, cn } from "../components/ui";
import { brl, tenant } from "../data";
import { BLACK_PRICE } from "../store/useClubStore";
import { useCustomerStore } from "../store/useCustomerStore";
import { useScreenInit } from "../useScreenInit";

const BENEFITS = ["Todo o menu secreto liberado", "Pontos em dobro em todas as compras", "1 café coado por dia na loja"];

export default function BlackCheckout() {
  const init = useScreenInit();
  const router = useRouter();
  const { isBlack, renewsOn, subscribeBlack } = useCustomerStore();
  const [method, setMethod] = useState<"pix" | "card">("card");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(init.success === true);
  useEffect(() => {
    if (init.success === true) subscribeBlack();
  }, [init.success, subscribeBlack]);
  const back = () => router.push(`/c/${tenant.slug}?aba=menu`);

  const pay = () => {
    setBusy(true);
    setTimeout(() => {
      subscribeBlack();
      setBusy(false);
      setDone(true);
    }, 1200);
  };

  if (done || isBlack) {
    return (
      <ThemeScope className="flex justify-center">
        <div className="flex min-h-screen w-full max-w-md animate-fade-in flex-col px-6 pt-16 pb-8">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-tier-black text-white">
            <Check size={26} strokeWidth={2.5} />
          </span>
          <h1 className="mt-6 text-[26px] leading-tight font-semibold tracking-tight">Você agora é Black</h1>
          <p className="mt-2 text-[15px] text-muted-foreground">O menu secreto completo já está liberado. Mostre o app no balcão para usar os benefícios.</p>
          <dl className="mt-8 divide-y divide-border rounded-2xl border border-border bg-card text-sm">
            <div className="flex justify-between gap-4 p-4"><dt className="text-muted-foreground">Plano</dt><dd className="font-medium">Black mensal</dd></div>
            <div className="flex justify-between gap-4 p-4"><dt className="text-muted-foreground">Cobrado hoje</dt><dd className="font-medium tabular-nums">{brl(BLACK_PRICE)}</dd></div>
            <div className="flex justify-between gap-4 p-4"><dt className="text-muted-foreground">Próxima cobrança</dt><dd className="font-medium tabular-nums">{renewsOn}</dd></div>
          </dl>
          <Button size="lg" className="mt-auto h-13 w-full text-base" onClick={back}>
            Ver menu secreto
          </Button>
        </div>
      </ThemeScope>
    );
  }

  return (
    <ThemeScope className="flex justify-center">
      <div className="relative flex min-h-screen w-full max-w-md flex-col">
        <header className="flex h-14 items-center px-3">
          <button
            onClick={back}
            className="flex h-10 cursor-pointer items-center gap-1 rounded-lg px-2 text-sm font-medium text-muted-foreground outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
          >
            <ChevronLeft size={18} /> Voltar
          </button>
        </header>

        <main className="flex-1 px-5 pb-44">
          <section className="rounded-2xl bg-tier-black p-6 text-white">
            <p className="text-[13px] font-medium text-white/70">{tenant.name}</p>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight">Passe Black</h1>
            <p className="mt-1 text-[15px] text-white/80">
              <span className="text-xl font-semibold text-white tabular-nums">{brl(BLACK_PRICE)}</span> por mês
            </p>
            <ul className="mt-6 flex flex-col gap-3 border-t border-white/15 pt-5">
              {BENEFITS.map((b) => (
                <li key={b} className="flex items-center gap-3 text-[15px]">
                  <Check size={18} strokeWidth={2.25} className="shrink-0 text-white/80" />
                  {b}
                </li>
              ))}
            </ul>
          </section>

          <fieldset className="mt-8">
            <legend className="text-[15px] font-semibold tracking-tight">Forma de pagamento</legend>
            <div role="radiogroup" className="mt-3 flex flex-col gap-2">
              {[
                { id: "card" as const, label: "Cartão de crédito", sub: "Visa final 4242", icon: CreditCard },
                { id: "pix" as const, label: "Pix", sub: "Aprovação na hora", icon: QrCode },
              ].map((m) => {
                const Icon = m.icon;
                const sel = method === m.id;
                return (
                  <button
                    key={m.id}
                    role="radio"
                    aria-checked={sel}
                    onClick={() => setMethod(m.id)}
                    className={cn(
                      "flex h-16 cursor-pointer items-center gap-4 rounded-xl border bg-card px-4 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      sel ? "border-foreground" : "border-border hover:bg-muted",
                    )}
                  >
                    <Icon size={20} strokeWidth={1.75} className="shrink-0 text-muted-foreground" />
                    <span className="min-w-0 flex-1">
                      <span className="block text-[15px] font-medium">{m.label}</span>
                      <span className="block text-[13px] text-muted-foreground">{m.sub}</span>
                    </span>
                    <span className={cn("flex h-5 w-5 items-center justify-center rounded-full border-2", sel ? "border-foreground" : "border-input")}>
                      {sel && <span className="h-2.5 w-2.5 rounded-full bg-foreground" />}
                    </span>
                  </button>
                );
              })}
            </div>
          </fieldset>
        </main>

        <div className="fixed inset-x-0 bottom-0 z-10 mx-auto w-full max-w-md border-t border-border bg-card px-5 pt-4 pb-6">
          <Button size="lg" className="h-13 w-full text-base" onClick={pay} aria-busy={busy}>
            {busy && <Loader2 size={18} className="animate-spin" />}
            {busy ? "Confirmando pagamento…" : `Assinar por ${brl(BLACK_PRICE)}/mês`}
          </Button>
          <p className="mt-3 text-center text-[13px] text-muted-foreground">
            Cobrança hoje e todo dia 14. Cancele quando quiser pelo app.
          </p>
        </div>
      </div>
    </ThemeScope>
  );
}

