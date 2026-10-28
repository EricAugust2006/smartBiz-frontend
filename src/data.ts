import { create } from "zustand";

// Fixed "today" so relative dates stay stable in the prototype.
export const TODAY = new Date(2026, 4, 14);

export const tenant = {
  name: "Padaria Aurora",
  slug: "padaria-aurora",
  initials: "PA",
  owner: { name: "Rafael Fonseca", initials: "RF", role: "Proprietário" },
};

export type Product = {
  id: string;
  sku: string;
  name: string;
  category: string;
  qty: number;
  unit: "un" | "kg" | "L";
  minQty: number;
  expires: string; // yyyy-mm-dd
  price: number;
};

const seed: Product[] = [
  { id: "p1", sku: "LAT-014", name: "Iogurte natural 170 g", category: "Laticínios", qty: 12, unit: "un", minQty: 10, expires: "2026-05-14", price: 6.9 },
  { id: "p2", sku: "PAD-003", name: "Croissant amanteigado", category: "Padaria", qty: 18, unit: "un", minQty: 20, expires: "2026-05-15", price: 8.5 },
  { id: "p3", sku: "LAT-002", name: "Queijo minas frescal", category: "Laticínios", qty: 4, unit: "kg", minQty: 3, expires: "2026-05-15", price: 49.9 },
  { id: "p4", sku: "CON-021", name: "Torta de limão (fatia)", category: "Confeitaria", qty: 9, unit: "un", minQty: 6, expires: "2026-05-17", price: 14.0 },
  { id: "p5", sku: "LAT-009", name: "Leite integral 1 L", category: "Laticínios", qty: 26, unit: "L", minQty: 24, expires: "2026-05-19", price: 5.79 },
  { id: "p6", sku: "BEB-011", name: "Suco de laranja 300 ml", category: "Bebidas", qty: 7, unit: "un", minQty: 12, expires: "2026-05-20", price: 9.0 },
  { id: "p7", sku: "PAD-001", name: "Pão francês", category: "Padaria", qty: 140, unit: "un", minQty: 120, expires: "2026-05-14", price: 0.9 },
  { id: "p8", sku: "CAF-001", name: "Café em grãos 1 kg", category: "Cafeteria", qty: 3, unit: "kg", minQty: 5, expires: "2026-09-30", price: 89.0 },
  { id: "p9", sku: "PAD-007", name: "Pão de queijo congelado", category: "Padaria", qty: 6, unit: "kg", minQty: 4, expires: "2026-08-12", price: 42.0 },
  { id: "p10", sku: "CON-004", name: "Bolo de cenoura", category: "Confeitaria", qty: 5, unit: "un", minQty: 3, expires: "2026-05-18", price: 32.0 },
  { id: "p11", sku: "MER-030", name: "Geleia de morango 320 g", category: "Mercearia", qty: 22, unit: "un", minQty: 8, expires: "2027-01-10", price: 18.9 },
  { id: "p12", sku: "MER-012", name: "Mel silvestre 500 g", category: "Mercearia", qty: 11, unit: "un", minQty: 6, expires: "2027-11-02", price: 34.5 },
  { id: "p13", sku: "BEB-004", name: "Água com gás 500 ml", category: "Bebidas", qty: 48, unit: "un", minQty: 24, expires: "2027-03-01", price: 4.5 },
  { id: "p14", sku: "LAT-020", name: "Manteiga com sal 200 g", category: "Laticínios", qty: 2, unit: "un", minQty: 6, expires: "2026-07-22", price: 15.9 },
];

type InventoryState = {
  products: Product[];
  add: (p: Omit<Product, "id">) => void;
  setQty: (id: string, qty: number) => void;
};

export const useInventoryStore = create<InventoryState>((set) => ({
  products: seed,
  add: (p) => set((s) => ({ products: [{ ...p, id: "p" + (s.products.length + 1) + Date.now() }, ...s.products] })),
  setQty: (id, qty) => set((s) => ({ products: s.products.map((p) => (p.id === id ? { ...p, qty } : p)) })),
}));

export function daysUntil(date: string): number {
  const [y, m, d] = date.split("-").map(Number);
  const target = new Date(y, m - 1, d);
  return Math.round((target.getTime() - TODAY.getTime()) / 86400000);
}

export function expiryLabel(days: number): string {
  if (days < 0) return "Vencido";
  if (days === 0) return "Hoje";
  if (days === 1) return "Amanhã";
  return `Em ${days} dias`;
}

export const brl = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export function formatDate(date: string): string {
  const [y, m, d] = date.split("-");
  return `${d}/${m}/${y}`;
}

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

