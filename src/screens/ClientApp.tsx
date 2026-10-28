import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { CheckCircle2, ChevronLeft, ChevronRight, Gift, Home, Lock, Target, UtensilsCrossed } from "lucide-react";
import { Badge, Button, Dialog, ErrorState, Progress, Skeleton, TenantMark, ThemeScope, Toaster, cn, toast } from "../components/ui";
import { brl, customer, missions, tenant } from "../data";
import { canAccess, secretMenu, useCustomerStore, type SecretItem } from "../store/useCustomerStore";
import { useClubStore, type ClubReward } from "../store/useClubStore";
import { useMockQuery } from "../lib/useMockQuery";
import { useScreenInit } from "../useScreenInit";

type Tab = "inicio" | "missoes" | "menu" | "recompensas";

export default function ClientApp() {
  const init = useScreenInit();
  const router = useRouter();
  const initialTab = typeof router.query.aba === "string" ? router.query.aba as Tab : undefined;
  const [tab, setTab] = useState<Tab>(initialTab ?? (init.tab as Tab) ?? "inicio");
  useEffect(() => {
    if (router.isReady && initialTab) setTab(initialTab);
  }, [router.isReady, initialTab]);
  const points = useCustomerStore((s) => s.points);
  const redeem = useCustomerStore((s) => s.redeem);
  const rewards = useClubStore((s) => s.rewards).filter((r) => r.active);
  const [redeeming, setRedeeming] = useState<ClubReward | null>(
    typeof init.redeem === "string" ? rewards.find((r) => r.id === init.redeem) ?? null : null,
  );
  const q = useMockQuery("client");

  const tabs = [
    { id: "inicio" as const, label: "Início", icon: Home },
    { id: "missoes" as const, label: "Missões", icon: Target },
    { id: "menu" as const, label: "Menu secreto", icon: UtensilsCrossed },
    { id: "recompensas" as const, label: "Recompensas", icon: Gift },
  ];

  return (
    <ThemeScope className="flex justify-center bg-background">
      <div className="relative flex min-h-screen w-full max-w-md flex-col bg-background">
        <header className="sticky top-0 z-10 flex h-14 items-center gap-3 border-b border-border bg-card px-5">
          <TenantMark size="sm" />
          <span className="flex-1 text-[15px] font-semibold tracking-tight">{tenant.name}</span>
          <Link href="/painel" aria-label="Voltar ao painel" className="flex h-9 items-center gap-1 rounded-lg px-2 text-[13px] font-medium text-muted-foreground hover:bg-muted">
            <ChevronLeft size={16} /> Painel
          </Link>
        </header>

        <main className="flex-1 px-5 pt-6 pb-28">
          {q.isLoading ? (
            <ClientSkeleton />
          ) : q.isError ? (
            <div className="rounded-2xl border border-border bg-card">
              <ErrorState title="Não foi possível carregar seus pontos" onRetry={q.refetch} />
            </div>
          ) : (
            <>
              {tab === "inicio" && <HomeTab rewards={rewards} onRedeem={setRedeeming} onGo={setTab} />}
              {tab === "missoes" && (
                <section key="missoes" className="animate-fade-in">
                  <h1 className="text-2xl font-semibold tracking-tight">Missões</h1>
                  <MissionList className="mt-5" />
                </section>
              )}
              {tab === "menu" && <SecretMenuTab />}
              {tab === "recompensas" && (
                <section key="recompensas" className="animate-fade-in">
                  <div className="flex items-baseline justify-between">
                    <h1 className="text-2xl font-semibold tracking-tight">Recompensas</h1>
                    <span className="text-sm font-medium tabular-nums text-muted-foreground">{points} pontos</span>
                  </div>
                  <RewardList className="mt-5" rewards={rewards} onRedeem={setRedeeming} />
                </section>
              )}
            </>
          )}
        </main>

        <nav aria-label="Navegação" className="fixed inset-x-0 bottom-0 z-20 mx-auto w-full max-w-md border-t border-border bg-card px-2 pt-2 pb-5">
          <ul className="grid grid-cols-4">
            {tabs.map((t) => {
              const Icon = t.icon;
              const active = tab === t.id;
              return (
                <li key={t.id}>
                  <button
                    onClick={() => setTab(t.id)}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex h-14 w-full cursor-pointer flex-col items-center justify-center gap-1 rounded-xl text-[11px] font-medium whitespace-nowrap outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      active ? "text-primary-text" : "text-muted-foreground",
                    )}
                  >
                    <span className={cn("flex h-8 w-14 items-center justify-center rounded-full", active && "bg-primary-soft")}>
                      <Icon size={20} strokeWidth={active ? 2.25 : 1.75} />
                    </span>
                    {t.label}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        <Dialog
          variant="sheet"
          open={!!redeeming}
          onClose={() => setRedeeming(null)}
          title={`Resgatar ${redeeming?.title.toLowerCase() ?? ""}?`}
          description={redeeming ? `Usa ${redeeming.cost} dos seus ${points} pontos. Mostre o código no balcão em até 24 horas.` : undefined}
          footer={
            <>
              <Button variant="ghost" size="lg" onClick={() => setRedeeming(null)}>Cancelar</Button>
              <Button
                size="lg"
                onClick={() => {
                  if (!redeeming) return;
                  redeem(redeeming.cost);
                  toast(`${redeeming.title} resgatado. Código AUR-4821`);
                  setRedeeming(null);
                }}
              >
                Resgatar por {redeeming?.cost} pontos
              </Button>
            </>
          }
        />
        <Toaster bottomOffset="bottom-28" />
      </div>
    </ThemeScope>
  );
}

function ClientSkeleton() {
  return (
    <div className="flex flex-col gap-8" aria-busy="true" aria-label="Carregando">
      <Skeleton className="h-[198px] w-full rounded-2xl" />
      <div className="flex flex-col gap-3">
        <Skeleton className="h-5 w-40" />
        <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-4">
          {[0, 1].map((i) => (
            <div key={i} className="flex flex-col gap-2">
              <Skeleton className="h-4 w-3/5" />
              <Skeleton className="h-3 w-4/5" />
              <Skeleton className="mt-1 h-1.5 w-full" />
            </div>
          ))}
        </div>
      </div>
      <div className="flex flex-col gap-3">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-40 w-full rounded-2xl" />
      </div>
    </div>
  );
}

function PointsCard() {
  const { points, lifetime, isBlack } = useCustomerStore();
  const toNext = customer.nextAt - lifetime;
  if (isBlack) {
    return (
      <section aria-label="Clube VIP" className="rounded-2xl bg-tier-black p-5 text-white shadow-card">
        <div className="flex items-center justify-between">
          <p className="text-[13px] font-medium text-white/80">Olá, {customer.name}</p>
          <span className="rounded-md border border-white/30 px-2 py-0.5 text-xs font-semibold tracking-wide">Black</span>
        </div>
        <p className="mt-5 text-4xl font-semibold tracking-tight tabular-nums">{points}</p>
        <p className="text-sm text-white/80">pontos no Clube VIP</p>
        <p className="mt-5 text-[13px] text-white/80">Pontos em dobro e menu secreto completo liberados</p>
      </section>
    );
  }
  return (
    <section aria-label="Clube VIP" className="rounded-2xl border border-primary-border bg-primary p-5 text-primary-foreground shadow-card">
      <div className="flex items-center justify-between">
        <p className="text-[13px] font-medium opacity-90">Olá, {customer.name}</p>
        <span className="rounded-md border border-current/25 px-2 py-0.5 text-xs font-medium">Nível {customer.level}</span>
      </div>
      <p className="mt-5 text-4xl font-semibold tracking-tight tabular-nums">{points}</p>
      <p className="text-sm opacity-90">pontos no Clube VIP</p>
      <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-current/20">
        <div className="h-full rounded-full bg-current" style={{ width: Math.min(100, (lifetime / customer.nextAt) * 100) + "%" }} />
      </div>
      <p className="mt-2 text-[13px] opacity-90">
        {toNext > 0 ? `Faltam ${toNext} pontos para o nível ${customer.nextLevel}` : `Você chegou ao nível ${customer.nextLevel}`}
      </p>
    </section>
  );
}

function HomeTab({ rewards, onRedeem, onGo }: { rewards: ClubReward[]; onRedeem: (r: ClubReward) => void; onGo: (t: Tab) => void }) {
  const state = useCustomerStore();
  const unlocked = secretMenu.filter((i) => canAccess(i.tier, state)).length;
  return (
    <div key="inicio" className="flex animate-fade-in flex-col gap-8">
      <PointsCard />

      <button
        onClick={() => onGo("menu")}
        className="-mt-4 flex cursor-pointer items-center gap-4 rounded-2xl border border-border bg-card p-4 text-left outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
      >
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted">
          {unlocked < secretMenu.length ? <Lock size={18} strokeWidth={1.75} /> : <UtensilsCrossed size={18} strokeWidth={1.75} />}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold">Menu secreto</span>
          <span className="mt-0.5 block text-[13px] text-muted-foreground">{unlocked} de {secretMenu.length} itens liberados para você</span>
        </span>
        <ChevronRight size={18} className="text-muted-foreground" />
      </button>
      <section>
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="text-lg font-semibold tracking-tight">Suas missões</h2>
          <button className="cursor-pointer text-[13px] font-medium text-primary-text" onClick={() => onGo("missoes")}>Ver todas</button>
        </div>
        <MissionList />
      </section>
      <section>
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="text-lg font-semibold tracking-tight">Recompensas</h2>
          <button className="cursor-pointer text-[13px] font-medium text-primary-text" onClick={() => onGo("recompensas")}>Ver todas</button>
        </div>
        <RewardList rewards={rewards.slice(0, 2)} onRedeem={onRedeem} />
      </section>
    </div>
  );
}

function MissionList({ className }: { className?: string }) {
  return <ul className={cn("flex flex-col gap-3", className)}>{missions.map((mission) => {
    const done = mission.progress >= mission.goal;
    return <li key={mission.id} className="rounded-2xl border border-border bg-card p-4">
      <div className="flex items-start gap-3">
        <span className={cn("mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full", done ? "bg-success-soft text-success" : "bg-primary-soft text-primary-text")}><CheckCircle2 size={17} /></span>
        <div className="min-w-0 flex-1"><p className="text-sm font-semibold">{mission.title}</p><p className="mt-1 text-[13px] text-muted-foreground">{mission.detail}</p>
          <div className="mt-3 flex items-center gap-2"><Progress value={mission.progress} max={mission.goal} /><span className="shrink-0 text-xs tabular-nums text-muted-foreground">{mission.progress}/{mission.goal}</span></div>
          <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground"><span>{mission.endsIn}</span><span className="font-medium text-primary-text">+{mission.reward} pts</span></div>
        </div>
      </div>
    </li>;
  })}</ul>;
}

function RewardList({ rewards: rewardItems, onRedeem, className }: { rewards: ClubReward[]; onRedeem: (reward: ClubReward) => void; className?: string }) {
  const points = useCustomerStore((s) => s.points);
  return <ul className={cn("flex flex-col gap-3", className)}>{rewardItems.map((reward) => {
    const affordable = points >= reward.cost;
    return <li key={reward.id} className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary-text"><Gift size={18} /></span>
      <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{reward.title}</p><p className="mt-1 text-[13px] text-muted-foreground">{reward.cost} pontos · {brl(reward.cost / 10)} em valor</p></div>
      <Button size="sm" variant={affordable ? "primary" : "outline"} disabled={!affordable} onClick={() => onRedeem(reward)}>Resgatar</Button>
    </li>;
  })}</ul>;
}

function SecretMenuTab() {
  const state = useCustomerStore();
  return <section key="menu" className="animate-fade-in">
    <h1 className="text-2xl font-semibold tracking-tight">Menu secreto</h1>
    <p className="mt-1 text-sm text-muted-foreground">Itens especiais liberados conforme seu nível.</p>
    <ul className="mt-5 flex flex-col gap-3">{secretMenu.map((item: SecretItem) => {
      const unlocked = canAccess(item.tier, state);
      return <li key={item.id} className={cn("rounded-2xl border border-border bg-card p-4", !unlocked && "opacity-60")}>
        <div className="flex items-start justify-between gap-3"><div><div className="flex items-center gap-2"><h2 className="text-sm font-semibold">{item.name}</h2>{!unlocked && <Lock size={14} className="text-muted-foreground" />}</div><p className="mt-1 text-[13px] text-muted-foreground">{item.detail}</p></div><span className="shrink-0 text-sm font-semibold tabular-nums">{brl(item.price)}</span></div>
        <Badge className="mt-3" tone={unlocked ? "success" : "neutral"}>{unlocked ? "Disponível" : `Nível ${item.tier}`}</Badge>
      </li>;
    })}</ul>
  </section>;
}
