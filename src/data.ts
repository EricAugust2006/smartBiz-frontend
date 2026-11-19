import { create } from "zustand";

export const tenant = {
  name: "Padaria Aurora",
  slug: "padaria-aurora",
  initials: "PA",
  owner: { name: "Rafael Fonseca", initials: "RF", role: "Proprietário" },
};

export const brl = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

// Sales by hour: today (until 15h) vs yesterday
export const salesByHour = [
  { hour: "7h", today: 412, yesterday: 380 },
  { hour: "8h", today: 688, yesterday: 602 },
  { hour: "9h", today: 534, yesterday: 498 },
  { hour: "10h", today: 296, yesterday: 310 },
  { hour: "11h", today: 318, yesterday: 284 },
  { hour: "12h", today: 402, yesterday: 371 },
  { hour: "13h", today: 356, yesterday: 344 },
  { hour: "14h", today: 247, yesterday: 262 },
  { hour: "15h", today: 229, yesterday: 171 },
  { hour: "16h", today: null, yesterday: 296 },
  { hour: "17h", today: null, yesterday: 412 },
  { hour: "18h", today: null, yesterday: 455 },
];
export const ordersToday = 214;

// B2C customer
export const customer = {
  name: "Marina",
  points: 340,
  level: "Frequente",
  nextLevel: "VIP",
  nextAt: 500,
};

export type Mission = { id: string; title: string; detail: string; progress: number; goal: number; reward: number; endsIn: string };
export const missions: Mission[] = [
  { id: "m1", title: "Café da manhã da semana", detail: "Compre 5 cafés até domingo", progress: 3, goal: 5, reward: 50, endsIn: "Termina em 3 dias" },
  { id: "m2", title: "Prove a torta de limão", detail: "Peça 1 fatia na loja ou no balcão", progress: 0, goal: 1, reward: 30, endsIn: "Termina amanhã" },
  { id: "m3", title: "Traga um amigo", detail: "Seu amigo se cadastra e faz a primeira compra", progress: 1, goal: 1, reward: 80, endsIn: "Concluída" },
];

export type Reward = { id: string; title: string; cost: number };
export const rewards: Reward[] = [
  { id: "r1", title: "Pão de queijo", cost: 120 },
  { id: "r2", title: "Café coado", cost: 150 },
  { id: "r3", title: "Fatia de bolo", cost: 220 },
  { id: "r4", title: "Croissant + café", cost: 380 },
];

