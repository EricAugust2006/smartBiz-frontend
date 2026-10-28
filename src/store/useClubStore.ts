import { create } from "zustand";

export const BLACK_PRICE = 29.9;

export type ClubMission = {
  id: string;
  title: string;
  rule: string;
  reward: number;
  status: "ativa" | "sugerida" | "pausada";
  author: "IA" | "Você";
  joined: number;
  completed: number;
  ends: string; // dd/mm
  why?: string; // AI reasoning for suggestions
};

export type ClubReward = { id: string; title: string; cost: number; active: boolean; redeemed30d: number };

export type Subscriber = {
  id: string;
  name: string;
  initials: string;
  phone: string;
  since: string;
  visits30d: number;
  cancelsOn?: string;
};

const firsts = ["Marina", "João", "Camila", "Lucas", "Beatriz", "Rafael", "Juliana", "Pedro", "Larissa", "Gustavo", "Fernanda", "Thiago", "Aline", "Bruno", "Patrícia", "Diego", "Carolina", "Felipe", "Renata", "Eduardo"];
const lasts = ["Souza", "Oliveira", "Lima", "Costa", "Almeida", "Ribeiro", "Carvalho", "Gomes", "Martins", "Araújo", "Barbosa", "Rocha", "Dias", "Moreira", "Nunes"];
const months = ["jan", "fev", "mar", "abr", "mai"];

const subscribers: Subscriber[] = Array.from({ length: 37 }, (_, i) => {
  const first = firsts[i % firsts.length];
  const last = lasts[(i * 7) % lasts.length];
  const m = (i * 3) % 5;
  return {
    id: "s" + i,
    name: `${first} ${last}`,
    initials: first[0] + last[0],
    phone: `(11) •••••-${String(1000 + ((i * 7919) % 9000))}`,
    since: `${String(((i * 11) % 27) + 1).padStart(2, "0")} ${months[m]} 2026`,
    visits30d: ((i * 5) % 14) + 2,
    cancelsOn: i % 11 === 3 ? "14/06" : undefined,
  };
}).sort((a, b) => b.visits30d - a.visits30d);

const missions: ClubMission[] = [
  { id: "cm4", title: "Volte esta semana", rule: "Pontos em dobro na próxima compra até domingo", reward: 100, status: "sugerida", author: "IA", joined: 0, completed: 0, ends: "18/05", why: "12 clientes VIP estão sem visita há 21 dias" },
  { id: "cm5", title: "Combo da tarde", rule: "Compre café + croissant depois das 15h", reward: 40, status: "sugerida", author: "IA", joined: 0, completed: 0, ends: "15/05", why: "18 croissants vencem amanhã" },
  { id: "cm1", title: "Café da manhã da semana", rule: "Compre 5 cafés até domingo", reward: 50, status: "ativa", author: "IA", joined: 86, completed: 23, ends: "17/05" },
  { id: "cm2", title: "Prove a torta de limão", rule: "Peça 1 fatia na loja ou no balcão", reward: 30, status: "ativa", author: "IA", joined: 41, completed: 9, ends: "15/05" },
  { id: "cm3", title: "Traga um amigo", rule: "O amigo se cadastra e faz a primeira compra", reward: 80, status: "ativa", author: "Você", joined: 18, completed: 6, ends: "31/05" },
  { id: "cm6", title: "Aniversariante do mês", rule: "Visite a loja no mês do seu aniversário", reward: 120, status: "pausada", author: "Você", joined: 14, completed: 11, ends: "31/05" },
];

const rewards: ClubReward[] = [
  { id: "r1", title: "Pão de queijo", cost: 120, active: true, redeemed30d: 64 },
  { id: "r2", title: "Café coado", cost: 150, active: true, redeemed30d: 81 },
  { id: "r3", title: "Fatia de bolo", cost: 220, active: true, redeemed30d: 27 },
  { id: "r4", title: "Croissant + café", cost: 380, active: true, redeemed30d: 12 },
  { id: "r5", title: "Caneca Padaria Aurora", cost: 900, active: false, redeemed30d: 0 },
];

type ClubState = {
  missions: ClubMission[];
  rewards: ClubReward[];
  subscribers: Subscriber[];
  setMissionStatus: (id: string, status: ClubMission["status"]) => void;
  removeMission: (id: string) => ClubMission | undefined;
  restoreMission: (m: ClubMission) => void;
  addMission: (m: Omit<ClubMission, "id" | "joined" | "completed" | "author" | "status">) => void;
  toggleReward: (id: string, active: boolean) => void;
  addReward: (title: string, cost: number) => void;
};

export const useClubStore = create<ClubState>((set, get) => ({
  missions,
  rewards,
  subscribers,
  setMissionStatus: (id, status) => set((s) => ({ missions: s.missions.map((m) => (m.id === id ? { ...m, status } : m)) })),
  removeMission: (id) => {
    const m = get().missions.find((x) => x.id === id);
    set((s) => ({ missions: s.missions.filter((x) => x.id !== id) }));
    return m;
  },
  restoreMission: (m) => set((s) => ({ missions: [m, ...s.missions] })),
  addMission: (m) => set((s) => ({ missions: [{ ...m, id: "cm" + Date.now(), joined: 0, completed: 0, author: "Você", status: "ativa" }, ...s.missions] })),
  toggleReward: (id, active) => set((s) => ({ rewards: s.rewards.map((r) => (r.id === id ? { ...r, active } : r)) })),
  addReward: (title, cost) => set((s) => ({ rewards: [...s.rewards, { id: "r" + Date.now(), title, cost, active: true, redeemed30d: 0 }] })),
}));

export const payingCount = (subs: Subscriber[]) => subs.length;
export const mrr = (subs: Subscriber[]) => subs.length * BLACK_PRICE;

