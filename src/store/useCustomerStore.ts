import { create } from "zustand";
import { customer } from "../data";

export type Tier = "Frequente" | "VIP" | "Black";

export type SecretItem = { id: string; name: string; detail: string; price: number; tier: Tier };

export const secretMenu: SecretItem[] = [
  { id: "sm1", name: "Cappuccino de doce de leite", detail: "Espresso duplo, leite vaporizado e doce de leite artesanal", price: 14, tier: "Frequente" },
  { id: "sm2", name: "Pão de fermentação natural com azeite", detail: "Fatia grossa tostada com azeite e flor de sal", price: 12, tier: "Frequente" },
  { id: "sm3", name: "Croissant de pistache", detail: "Recheado com creme de pistache e finalizado no forno", price: 18, tier: "VIP" },
  { id: "sm4", name: "Torta basca da casa", detail: "Cheesecake queimado, servido em fatia", price: 22, tier: "VIP" },
  { id: "sm5", name: "Café especial do mês", detail: "Etiópia Yirgacheffe coado na hora, notas florais", price: 16, tier: "Black" },
  { id: "sm6", name: "Brunch Aurora para dois", detail: "Pães, frios, ovos mexidos, frutas e 2 bebidas", price: 89, tier: "Black" },
];

type CustomerState = {
  points: number;
  lifetime: number; // level progress, not reduced by redemptions
  isBlack: boolean;
  renewsOn: string;
  redeem: (cost: number) => void;
  subscribeBlack: () => void;
};

export const useCustomerStore = create<CustomerState>((set) => ({
  points: customer.points,
  lifetime: customer.points,
  isBlack: false,
  renewsOn: "14/06/2026",
  redeem: (cost) => set((s) => ({ points: s.points - cost })),
  subscribeBlack: () => set({ isBlack: true }),
}));

export function canAccess(tier: Tier, s: { lifetime: number; isBlack: boolean }) {
  if (s.isBlack) return true;
  if (tier === "Frequente") return true;
  if (tier === "VIP") return s.lifetime >= customer.nextAt;
  return false;
}

