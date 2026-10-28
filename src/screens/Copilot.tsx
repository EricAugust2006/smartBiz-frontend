import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, ArrowUp, Bot } from "lucide-react";
import {
  DashboardLayout,
  PageHeader,
} from "../components/layout/DashboardLayout";
import { Button, Card, cn } from "../components/ui";
import {
  brl,
  daysUntil,
  expiryLabel,
  ordersToday,
  salesByHour,
  tenant,
  useInventoryStore,
  type Product,
} from "../data";
import { mrr, useClubStore, type Subscriber } from "../store/useClubStore";
import { useScreenInit } from "../useScreenInit";

type Row = { label: string; value: string; warn?: boolean };
type Msg = {
  id: string;
  role: "user" | "assistant";
  text: string;
  rows?: Row[];
  action?: { label: string; to: string };
};

const SUGGESTIONS = [
  "Quanto faturei hoje?",
  "O que vence esta semana?",
  "O que preciso repor?",
  "Como está o Clube Black?",
];

function norm(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function answer(
  question: string,
  products: Product[],
  subs: Subscriber[],
): Omit<Msg, "id" | "role"> {
  const q = norm(question);

  if (/venc|validade|perto|estrag/.test(q)) {
    const list = products
      .map((p) => ({ ...p, days: daysUntil(p.expires) }))
      .filter((p) => p.days >= 0 && p.days <= 7)
      .sort((a, b) => a.days - b.days);
    const value = list.reduce((s, p) => s + p.qty * p.price, 0);
    return {
      text: `${list.length} produtos vencem nos próximos 7 dias, somando ${brl(value)} em estoque. Os mais urgentes:`,
      rows: list
        .slice(0, 5)
        .map((p) => ({
          label: `${p.name} · ${p.qty} ${p.unit}`,
          value: expiryLabel(p.days),
          warn: p.days <= 1,
        })),
      action: {
        label: "Ver no estoque",
        to: "/painel/estoque?filtro=vencendo",
      },
    };
  }

  if (/repor|comprar|baixo|acab|falt|pedido de compra/.test(q)) {
    const low = products
      .filter((p) => p.qty < p.minQty)
      .sort((a, b) => a.qty / a.minQty - b.qty / b.minQty);
    return {
      text: `${low.length} itens estão abaixo do estoque mínimo. Sugiro repor nesta ordem:`,
      rows: low.map((p) => ({
        label: p.name,
        value: `${p.qty} de ${p.minQty} ${p.unit}`,
        warn: p.qty / p.minQty < 0.5,
      })),
      action: {
        label: "Ver estoque baixo",
        to: "/painel/estoque?filtro=baixo",
      },
    };
  }

  if (/black|assin|clube|vip|fideli/.test(q)) {
    const cancels = subs.filter((s) => s.cancelsOn).length;
    const avg = subs.reduce((s, x) => s + x.visits30d, 0) / subs.length;
    return {
      text: `Você tem ${subs.length} assinantes Black, gerando ${brl(mrr(subs))} por mês.`,
      rows: [
        {
          label: "Cancelamentos agendados",
          value: String(cancels),
          warn: cancels > 0,
        },
        {
          label: "Visitas por assinante (30 dias)",
          value: avg.toFixed(1).replace(".", ","),
        },
      ],
      action: { label: "Ver assinantes", to: "/painel/clube?aba=assinantes" },
    };
  }

  if (/fatur|vend|receita|financ|ticket|ganh|caixa|hoje/.test(q)) {
    const elapsed = salesByHour.filter((h) => h.today !== null);
    const today = elapsed.reduce((s, h) => s + (h.today ?? 0), 0);
    const yest = elapsed.reduce((s, h) => s + h.yesterday, 0);
    const best = elapsed.reduce((a, b) =>
      (b.today ?? 0) > (a.today ?? 0) ? b : a,
    );
    const delta = Math.round(((today - yest) / yest) * 100);
    return {
      text: `Até as 15h você faturou ${brl(today)}, ${delta}% acima do mesmo horário de ontem.`,
      rows: [
        { label: "Pedidos", value: String(ordersToday) },
        { label: "Ticket médio", value: brl(today / ordersToday) },
        {
          label: "Melhor horário",
          value: `${best.hour} · ${brl(best.today ?? 0)}`,
        },
      ],
    };
  }

  return {
    text: "Ainda não sei responder isso. Posso ajudar com vendas, estoque, validade e Clube VIP.",
  };
}

export default function Copilot() {
  const init = useScreenInit();
  const products = useInventoryStore((s) => s.products);
  const subs = useClubStore((s) => s.subscribers);
  const [messages, setMessages] = useState<Msg[]>(() => {
    if (init.conversation !== true) return [];
    const q1 = "O que vence esta semana?";
    const q2 = "E o que preciso repor?";
    return [
      { id: "u1", role: "user", text: q1 },
      { id: "a1", role: "assistant", ...answer(q1, products, subs) },
      { id: "u2", role: "user", text: q2 },
      { id: "a2", role: "assistant", ...answer(q2, products, subs) },
    ];
  });
  const [draft, setDraft] = useState("");
  const [thinking, setThinking] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages, thinking]);

  const send = (text: string) => {
    const t = text.trim();
    if (!t || thinking) return;
    setMessages((m) => [...m, { id: "u" + Date.now(), role: "user", text: t }]);
    setDraft("");
    setThinking(true);
    setTimeout(() => {
      setMessages((m) => [
        ...m,
        {
          id: "a" + Date.now(),
          role: "assistant",
          ...answer(t, products, subs),
        },
      ]);
      setThinking(false);
      inputRef.current?.focus();
    }, 900);
  };

  const empty = messages.length === 0;

  return (
    <DashboardLayout>
      <PageHeader
        title="Copiloto"
        action={
          !empty && (
            <Button variant="outline" onClick={() => setMessages([])}>
              Nova conversa
            </Button>
          )
        }
      />

      {/* ds-ok: chat fills the viewport below the page header */}
      <Card className="flex h-[calc(100dvh-10.5rem)] min-h-[480px] flex-col overflow-hidden lg:h-[calc(100dvh-9.5rem)]">
        <div ref={scrollRef} className="flex-1 overflow-y-auto">
          {empty ? (
            <div className="mx-auto flex h-full max-w-xl flex-col justify-center gap-6 px-6 py-10">
              <div className="flex flex-col gap-2">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-soft text-primary-text">
                  <Bot size={20} strokeWidth={1.75} />
                </span>
                <h2 className="mt-2 text-xl font-semibold tracking-tight">
                  Pergunte sobre o seu negócio
                </h2>
                <p className="text-sm text-muted-foreground">
                  As respostas usam as vendas, o estoque e o Clube VIP da{" "}
                  {tenant.name} em tempo real
                </p>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-border px-4 py-3 text-left text-sm font-medium outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {s}
                    <ArrowRight
                      size={16}
                      className="shrink-0 text-subtle-foreground"
                    />
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <ol className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-6 sm:px-6">
              {messages.map((m) => (
                <li
                  key={m.id}
                  className={cn(
                    "flex animate-fade-in",
                    m.role === "user" ? "justify-end" : "justify-start gap-3",
                  )}
                >
                  {m.role === "user" ? (
                    <p className="max-w-[80%] rounded-2xl rounded-br-md bg-muted px-4 py-2.5 text-sm">
                      {m.text}
                    </p>
                  ) : (
                    <>
                      <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-primary-text">
                        <Bot size={15} strokeWidth={1.75} />
                      </span>
                      <div className="flex min-w-0 max-w-xl flex-1 flex-col gap-3">
                        <p className="text-sm leading-relaxed">{m.text}</p>
                        {m.rows && (
                          <ul className="divide-y divide-border rounded-xl border border-border">
                            {m.rows.map((r) => (
                              <li
                                key={r.label}
                                className="flex items-center justify-between gap-4 px-4 py-2.5 text-sm"
                              >
                                <span className="min-w-0 truncate">
                                  {r.label}
                                </span>
                                <span
                                  className={cn(
                                    "shrink-0 tabular-nums",
                                    r.warn
                                      ? "font-medium text-warning"
                                      : "text-muted-foreground",
                                  )}
                                >
                                  {r.value}
                                </span>
                              </li>
                            ))}
                          </ul>
                        )}
                        {m.action && (
                          <Link
                            href={m.action.to}
                            className="inline-flex items-center gap-1.5 self-start text-sm font-medium text-primary-text hover:underline"
                          >
                            {m.action.label} <ArrowRight size={15} />
                          </Link>
                        )}
                      </div>
                    </>
                  )}
                </li>
              ))}
              {thinking && (
                <li className="flex animate-fade-in items-center gap-3">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary-soft text-primary-text">
                    <Bot size={15} strokeWidth={1.75} />
                  </span>
                  <span className="text-sm text-muted-foreground">
                    Analisando seus dados…
                  </span>
                </li>
              )}
            </ol>
          )}
        </div>

        <form
          className="border-t border-border p-3 sm:p-4"
          onSubmit={(e) => {
            e.preventDefault();
            send(draft);
          }}
        >
          <div className="mx-auto flex max-w-3xl items-end gap-2 rounded-xl border border-border px-3 py-2 focus-within:ring-2 focus-within:ring-ring">
            <textarea
              ref={inputRef}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send(draft);
                }
              }}
              rows={1}
              placeholder="Pergunte sobre vendas, estoque ou o Clube…"
              className="max-h-32 flex-1 resize-none bg-transparent py-1.5 text-sm outline-none placeholder:text-subtle-foreground"
            />
            <Button
              type="submit"
              size="sm"
              disabled={!draft.trim() || thinking}
              aria-label="Enviar"
            >
              <ArrowUp size={16} />
            </Button>
          </div>
        </form>
      </Card>
    </DashboardLayout>
  );
}
