import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  DashboardLayout,
  PageHeader,
} from "../components/layout/DashboardLayout";
import {
  Badge,
  Button,
  Card,
  CardHeader,
  ErrorState,
  Skeleton,
  toast,
} from "../components/ui";
import { useMockQuery } from "../lib/useMockQuery";
import {
  brl,
  daysUntil,
  expiryLabel,
  ordersToday,
  salesByHour,
  useInventoryStore,
} from "../data";
import { useScreenInit } from "../useScreenInit";
import { useThemeStore } from "../store/useThemeStore";

export default function Dashboard() {
  const init = useScreenInit();
  const products = useInventoryStore((s) => s.products);
  // SVG attributes can't read CSS variables, so the chart takes the resolved brand token
  const accent = useThemeStore((s) => s.tokens.text);
  const q = useMockQuery("dashboard");

  const expiring = products
    .map((p) => ({ ...p, days: daysUntil(p.expires) }))
    .filter((p) => p.days >= 0 && p.days <= 7)
    .sort((a, b) => a.days - b.days);
  const urgent = expiring.filter((p) => p.days <= 1);
  const urgentNames = urgent.map((p) => p.name.split(" ")[0]);
  const namesText =
    urgentNames.length > 2
      ? `${urgentNames.slice(0, 2).join(", ")} e mais ${urgentNames.length - 2}`
      : urgentNames.join(" e ");
  const urgentValue = urgent.reduce((s, p) => s + p.qty * p.price, 0);
  const lowStock = products.filter((p) => p.qty < p.minQty);

  const elapsed = salesByHour.filter((h) => h.today !== null);
  const today = elapsed.reduce((s, h) => s + (h.today ?? 0), 0);
  const yesterdaySame = elapsed.reduce((s, h) => s + h.yesterday, 0);
  const delta = Math.round(((today - yesterdaySame) / yesterdaySame) * 100);

  const insights = [
    {
      title: `${urgent.length} produtos vencem até amanhã`,
      body: `${namesText} somam ${brl(urgentValue)} em estoque. Um combo com café no fim da tarde ajuda a escoar.`,
      action: "Criar promoção",
      onClick: () => toast("Promoção criada para hoje até 19h"),
      primary: true,
    },
    {
      title: `${lowStock.length} itens abaixo do estoque mínimo`,
      body: "Café em grãos acaba antes de sexta no ritmo atual de vendas da manhã.",
      action: "Ver estoque",
      to: "/painel/estoque",
    },
    {
      title: "12 clientes VIP sem visita há 21 dias",
      body: "Envie uma missão com pontos em dobro para trazê-los de volta nesta semana.",
      action: "Revisar missão",
      to: "/painel/clube",
    },
  ];

  return (
    <DashboardLayout initialMenuOpen={init.menuOpen === true}>
      <PageHeader title="Início" />

      {q.isLoading ? (
        <DashboardSkeleton />
      ) : q.isError ? (
        <Card>
          <ErrorState
            title="Não foi possível carregar o resumo do dia"
            onRetry={q.refetch}
          />
        </Card>
      ) : (
        <div className="grid gap-6 xl:grid-cols-3">
          <Card className="xl:col-span-2">
            <CardHeader title="Resumo do dia" meta="Gerado às 07:30 pela IA" />
            <ol className="divide-y divide-border">
              {insights.map((it, i) => (
                <li
                  key={it.title}
                  className="flex flex-col gap-3 px-6 py-5 sm:flex-row sm:items-center sm:gap-6"
                >
                  <span className="hidden h-7 w-7 shrink-0 items-center justify-center rounded-full border border-border text-xs font-semibold text-muted-foreground tabular-nums sm:flex">
                    {i + 1}
                  </span>
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <p className="text-[15px] font-medium tracking-tight">
                      {it.title}
                    </p>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      {it.body}
                    </p>
                  </div>
                  {it.to ? (
                    <Link href={it.to} className="shrink-0">
                      <Button variant="outline" size="sm" tabIndex={-1}>
                        {it.action}
                      </Button>
                    </Link>
                  ) : (
                    <Button
                      variant={it.primary ? "primary" : "outline"}
                      size="sm"
                      onClick={it.onClick}
                    >
                      {it.action}
                    </Button>
                  )}
                </li>
              ))}
            </ol>
          </Card>

          <Card className="flex flex-col">
            <CardHeader
              title="Vencem em 7 dias"
              meta={`${expiring.length} produtos`}
            />
            <ul className="flex-1 divide-y divide-border px-6">
              {expiring.slice(0, 6).map((p) => (
                <li key={p.id} className="flex items-center gap-4 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{p.name}</p>
                    <p className="text-[13px] text-muted-foreground tabular-nums">
                      {p.qty} {p.unit}
                    </p>
                  </div>
                  <Badge tone={p.days <= 1 ? "warning" : "neutral"}>
                    {expiryLabel(p.days)}
                  </Badge>
                </li>
              ))}
            </ul>
            <div className="border-t border-border px-6 py-3">
              <Link
                href="/painel/estoque?filtro=vencendo"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-primary-text hover:underline"
              >
                Ver todos no estoque <ArrowRight size={16} />
              </Link>
            </div>
          </Card>

          <Card className="xl:col-span-3">
            <div className="flex flex-wrap items-start justify-between gap-6 px-6 pt-5">
              <h2 className="text-[15px] font-semibold tracking-tight">
                Vendas
              </h2>
              <div className="flex items-center gap-4 text-[13px] text-muted-foreground">
                <span className="flex items-center gap-2">
                  <span className="h-0.5 w-4 rounded-full bg-primary-text" />
                  Hoje
                </span>
                <span className="flex items-center gap-2">
                  <span className="h-0.5 w-4 border-t-2 border-dashed border-subtle-foreground" />
                  Ontem
                </span>
              </div>
            </div>
            <dl className="flex flex-wrap gap-x-12 gap-y-4 px-6 pt-4">
              <div>
                <dt className="text-[13px] text-muted-foreground">
                  Faturamento até 15h
                </dt>
                <dd className="mt-1 flex items-baseline gap-2">
                  <span className="text-2xl font-semibold tracking-tight tabular-nums">
                    {brl(today)}
                  </span>
                  <span className="inline-flex items-center text-[13px] font-medium text-success">
                    <ArrowUpRight size={14} />
                    {delta}% vs ontem
                  </span>
                </dd>
              </div>
              <div>
                <dt className="text-[13px] text-muted-foreground">Pedidos</dt>
                <dd className="mt-1 text-2xl font-semibold tracking-tight tabular-nums">
                  {ordersToday}
                </dd>
              </div>
              <div>
                <dt className="text-[13px] text-muted-foreground">
                  Ticket médio
                </dt>
                <dd className="mt-1 text-2xl font-semibold tracking-tight tabular-nums">
                  {brl(today / ordersToday)}
                </dd>
              </div>
            </dl>
            <div className="h-64 px-2 pt-4 pb-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={salesByHour}
                  margin={{ top: 8, right: 16, left: 4, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="fillToday" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={accent} stopOpacity={0.14} />
                      <stop offset="100%" stopColor={accent} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} stroke="#e6e6e9" />
                  <XAxis
                    dataKey="hour"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 12, fill: "#6b6b73" }}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    width={56}
                    tick={{ fontSize: 12, fill: "#6b6b73" }}
                    tickFormatter={(v) => `R$ ${v}`}
                  />
                  <Tooltip
                    cursor={{ stroke: "#dcdce0" }}
                    formatter={(v, name) => [
                      brl(Number(v)),
                      name === "today" ? "Hoje" : "Ontem",
                    ]}
                    contentStyle={{
                      borderRadius: 10,
                      border: "1px solid var(--color-border)",
                      boxShadow: "var(--shadow-card)",
                      fontSize: 13,
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="yesterday"
                    stroke="#8b8b93"
                    strokeDasharray="4 4"
                    strokeWidth={1.5}
                    dot={false}
                  />
                  <Area
                    type="monotone"
                    dataKey="today"
                    stroke={accent}
                    strokeWidth={2}
                    fill="url(#fillToday)"
                    connectNulls={false}
                    dot={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
      )}
    </DashboardLayout>
  );
}

function DashboardSkeleton() {
  return (
    <div
      className="grid gap-6 xl:grid-cols-3"
      aria-busy="true"
      aria-label="Carregando resumo"
    >
      <Card className="xl:col-span-2">
        <div className="px-6 pt-5 pb-4">
          <Skeleton className="h-5 w-40" />
        </div>
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="flex items-center gap-6 border-t border-border px-6 py-5"
          >
            <Skeleton className="h-7 w-7 rounded-full" />
            <div className="flex flex-1 flex-col gap-2">
              <Skeleton className="h-4 w-2/5" />
              <Skeleton className="h-3.5 w-4/5" />
            </div>
            <Skeleton className="h-8 w-28" />
          </div>
        ))}
      </Card>
      <Card>
        <div className="px-6 pt-5 pb-4">
          <Skeleton className="h-5 w-32" />
        </div>
        <div className="flex flex-col divide-y divide-border px-6">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center gap-4 py-3">
              <div className="flex flex-1 flex-col gap-2">
                <Skeleton className="h-4 w-3/5" />
                <Skeleton className="h-3 w-12" />
              </div>
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
          ))}
        </div>
      </Card>
      <Card className="xl:col-span-3">
        <div className="px-6 pt-5 pb-4">
          <Skeleton className="h-5 w-24" />
        </div>
        <div className="px-6 pb-6">
          <Skeleton className="h-64 w-full" />
        </div>
      </Card>
    </div>
  );
}
