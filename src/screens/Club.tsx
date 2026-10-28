import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { Plus, Search } from "lucide-react";
import { DashboardLayout, PageHeader } from "../components/layout/DashboardLayout";
import { Avatar, Badge, Button, Card, Dialog, ErrorState, Field, Input, Progress, SegmentTabs, Switch, TableSkeleton, cn, toast } from "../components/ui";
import { brl } from "../data";
import { BLACK_PRICE, mrr, useClubStore, type ClubMission } from "../store/useClubStore";
import { useMockQuery } from "../lib/useMockQuery";
import { useScreenInit } from "../useScreenInit";

type Tab = "missoes" | "recompensas" | "assinantes";

export default function Club() {
  const init = useScreenInit();
  const router = useRouter();
  const initialTab = (typeof init.tab === "string" ? init.tab : typeof router.query.aba === "string" ? router.query.aba : null) as Tab | null;
  const [tab, setTab] = useState<Tab>(initialTab ?? "missoes");
  useEffect(() => {
    if (router.isReady && initialTab) setTab(initialTab);
  }, [router.isReady, initialTab]);
  const [newMission, setNewMission] = useState(init.newMission === true);
  const [newReward, setNewReward] = useState(false);
  const { missions, rewards, subscribers } = useClubStore();
  const q = useMockQuery("club");

  const activeMissions = missions.filter((m) => m.status !== "sugerida");
  const tabs = [
    { id: "missoes" as const, label: "Missões", count: activeMissions.length },
    { id: "recompensas" as const, label: "Recompensas", count: rewards.length },
    { id: "assinantes" as const, label: "Assinantes Black", count: subscribers.length },
  ];

  const action =
    tab === "missoes" ? (
      <Button onClick={() => setNewMission(true)}><Plus size={16} /> Criar missão</Button>
    ) : tab === "recompensas" ? (
      <Button onClick={() => setNewReward(true)}><Plus size={16} /> Adicionar recompensa</Button>
    ) : null;

  return (
    <DashboardLayout>
      <PageHeader title="Clube VIP" action={action} />

      <Card>
        <div className="flex flex-col gap-3 border-b border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <SegmentTabs ariaLabel="Seções do clube" value={tab} onChange={setTab} options={tabs.map((t) => ({ value: t.id, label: <>{t.label}{q.status === "success" ? ` (${t.count})` : ""}</> }))} />
        </div>
        {q.isLoading ? (
          <TableSkeleton rows={6} />
        ) : q.isError ? (
          <ErrorState title="Não foi possível carregar o Clube VIP" onRetry={q.refetch} />
        ) : tab === "missoes" ? (
          <MissionsPanel />
        ) : tab === "recompensas" ? (
          <RewardsPanel />
        ) : (
          <SubscribersPanel />
        )}
      </Card>

      <NewMissionDialog open={newMission} onClose={() => setNewMission(false)} />
      <NewRewardDialog open={newReward} onClose={() => setNewReward(false)} />
    </DashboardLayout>
  );
}

function MissionsPanel() {
  const { missions, setMissionStatus, removeMission, restoreMission } = useClubStore();
  const suggested = missions.filter((m) => m.status === "sugerida");
  const rest = missions.filter((m) => m.status !== "sugerida");

  return (
    <div>
      {suggested.length > 0 && (
        <div className="border-b border-border bg-primary-soft/40">
          <p className="px-6 pt-4 text-[13px] font-medium text-primary-text">Sugeridas pela IA hoje</p>
          <ul className="divide-y divide-border">
            {suggested.map((m) => (
              <li key={m.id} className="flex animate-fade-in flex-col gap-3 px-6 py-4 sm:flex-row sm:items-center sm:gap-6">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{m.title} <span className="font-normal text-muted-foreground">· +{m.reward} pts</span></p>
                  <p className="mt-0.5 text-[13px] text-muted-foreground">{m.rule}. Motivo: {m.why!.charAt(0).toLowerCase() + m.why!.slice(1)}</p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const removed = removeMission(m.id);
                      if (removed) toast("Sugestão descartada", () => restoreMission(removed));
                    }}
                  >
                    Descartar
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => { setMissionStatus(m.id, "ativa"); toast(`Missão "${m.title}" ativada`); }}>
                    Ativar missão
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="border-b border-border text-left text-[13px] text-muted-foreground">
              <th className="h-10 w-full px-6 font-medium">Missão</th>
              <th className="h-10 px-4 text-right font-medium">Recompensa</th>
              <th className="h-10 px-4 font-medium">Conclusões</th>
              <th className="h-10 px-4 font-medium">Termina</th>
              <th className="h-10 px-6 text-right font-medium">Ativa</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rest.map((m: ClubMission) => (
              <tr key={m.id} className="h-14 hover:bg-muted/50">
                <td className="px-6">
                  <p className={cn("font-medium whitespace-nowrap", m.status === "pausada" && "text-muted-foreground")}>{m.title}</p>
                  <p className="text-xs whitespace-nowrap text-muted-foreground">
                    {m.author === "IA" ? "Criada pela IA" : "Criada por você"}{m.status === "pausada" && " · Pausada"}
                  </p>
                </td>
                <td className="px-4 text-right whitespace-nowrap tabular-nums">+{m.reward} pts</td>
                <td className="px-4">
                  <div className="flex w-36 items-center gap-3">
                    <Progress value={m.completed} max={Math.max(1, m.joined)} />
                    <span className="shrink-0 text-xs text-muted-foreground tabular-nums">{m.completed}/{m.joined}</span>
                  </div>
                </td>
                <td className="px-4 whitespace-nowrap tabular-nums text-muted-foreground">{m.ends}</td>
                <td className="px-6 text-right">
                  <Switch
                    label={`${m.status === "ativa" ? "Pausar" : "Ativar"} ${m.title}`}
                    checked={m.status === "ativa"}
                    onChange={(v) => setMissionStatus(m.id, v ? "ativa" : "pausada")}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function RewardsPanel() {
  const { rewards, toggleReward } = useClubStore();
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[560px] text-sm">
        <thead>
          <tr className="border-b border-border text-left text-[13px] text-muted-foreground">
            <th className="h-10 w-full px-6 font-medium">Recompensa</th>
            <th className="h-10 px-4 text-right font-medium">Custo</th>
            <th className="h-10 px-4 text-right font-medium whitespace-nowrap">Resgates em 30 dias</th>
            <th className="h-10 px-6 text-right font-medium">Disponível</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rewards.map((r) => (
            <tr key={r.id} className="h-14 hover:bg-muted/50">
              <td className={cn("px-6 font-medium whitespace-nowrap", !r.active && "text-muted-foreground")}>{r.title}</td>
              <td className="px-4 text-right whitespace-nowrap tabular-nums">{r.cost} pts</td>
              <td className="px-4 text-right tabular-nums">{r.redeemed30d}</td>
              <td className="px-6 text-right">
                <Switch label={`Disponibilizar ${r.title}`} checked={r.active} onChange={(v) => toggleReward(r.id, v)} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SubscribersPanel() {
  const subs = useClubStore((s) => s.subscribers);
  const [query, setQuery] = useState("");
  const list = subs.filter((s) => s.name.toLowerCase().includes(query.toLowerCase()));
  const cancels = subs.filter((s) => s.cancelsOn).length;

  return (
    <div>
      <div className="flex flex-col gap-4 border-b border-border px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
        <dl className="flex flex-wrap gap-x-10 gap-y-2">
          <div>
            <dt className="text-[13px] text-muted-foreground">Receita mensal</dt>
            <dd className="text-lg font-semibold tracking-tight tabular-nums">{brl(mrr(subs))}</dd>
          </div>
          <div>
            <dt className="text-[13px] text-muted-foreground">Preço do passe</dt>
            <dd className="text-lg font-semibold tracking-tight tabular-nums">{brl(BLACK_PRICE)}/mês</dd>
          </div>
          <div>
            <dt className="text-[13px] text-muted-foreground">Cancelamentos agendados</dt>
            <dd className="text-lg font-semibold tracking-tight tabular-nums">{cancels}</dd>
          </div>
        </dl>
        <div className="relative sm:w-64">
          <Search size={16} className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-subtle-foreground" />
          <Input aria-label="Buscar assinante" placeholder="Buscar assinante" value={query} onChange={(e) => setQuery(e.target.value)} className="h-9 pl-9" />
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[680px] text-sm">
          <thead><tr className="border-b border-border text-left text-[13px] text-muted-foreground"><th className="h-10 px-6 font-medium">Assinante</th><th className="h-10 px-4 font-medium">Telefone</th><th className="h-10 px-4 font-medium">Desde</th><th className="h-10 px-4 text-right font-medium">Visitas em 30 dias</th><th className="h-10 px-6 text-right font-medium">Status</th></tr></thead>
          <tbody className="divide-y divide-border">{list.map((s) => <tr key={s.id} className="h-14 hover:bg-muted/50"><td className="px-6"><div className="flex items-center gap-3"><Avatar initials={s.initials} /><span className="font-medium">{s.name}</span></div></td><td className="px-4 text-muted-foreground">{s.phone}</td><td className="px-4 text-muted-foreground">{s.since}</td><td className="px-4 text-right tabular-nums">{s.visits30d}</td><td className="px-6 text-right">{s.cancelsOn ? <Badge tone="warning">Cancela em {s.cancelsOn}</Badge> : <Badge tone="success">Ativo</Badge>}</td></tr>)}</tbody>
        </table>
      </div>
    </div>
  );
}

function NewMissionDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const addMission = useClubStore((s) => s.addMission);
  const [title, setTitle] = useState("");
  const [rule, setRule] = useState("");
  const [reward, setReward] = useState("50");
  const save = () => {
    if (!title.trim() || !rule.trim() || !Number.isFinite(Number(reward)) || Number(reward) <= 0) return;
    addMission({ title: title.trim(), rule: rule.trim(), reward: Number(reward), ends: "31/05" });
    toast("Missão criada"); setTitle(""); setRule(""); setReward("50"); onClose();
  };
  return <Dialog open={open} onClose={onClose} title="Criar missão" description="Defina uma missão para seus clientes." footer={<><Button variant="outline" onClick={onClose}>Cancelar</Button><Button onClick={save}>Criar missão</Button></>}>
    <div className="flex flex-col gap-4"><Field id="mission-title" label="Nome da missão"><Input id="mission-title" value={title} onChange={(e) => setTitle(e.target.value)} /></Field><Field id="mission-rule" label="Regra"><Input id="mission-rule" value={rule} onChange={(e) => setRule(e.target.value)} /></Field><Field id="mission-reward" label="Recompensa em pontos"><Input id="mission-reward" inputMode="numeric" value={reward} onChange={(e) => setReward(e.target.value)} /></Field></div>
  </Dialog>;
}

function NewRewardDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const addReward = useClubStore((s) => s.addReward);
  const [title, setTitle] = useState("");
  const [cost, setCost] = useState("100");
  const save = () => {
    if (!title.trim() || !Number.isFinite(Number(cost)) || Number(cost) <= 0) return;
    addReward(title.trim(), Number(cost)); toast("Recompensa adicionada"); setTitle(""); setCost("100"); onClose();
  };
  return <Dialog open={open} onClose={onClose} title="Adicionar recompensa" footer={<><Button variant="outline" onClick={onClose}>Cancelar</Button><Button onClick={save}>Adicionar</Button></>}>
    <div className="flex flex-col gap-4"><Field id="reward-title" label="Nome"><Input id="reward-title" value={title} onChange={(e) => setTitle(e.target.value)} /></Field><Field id="reward-cost" label="Custo em pontos"><Input id="reward-cost" inputMode="numeric" value={cost} onChange={(e) => setCost(e.target.value)} /></Field></div>
  </Dialog>;
}
