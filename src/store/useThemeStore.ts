import { create } from "zustand";
import { deriveBrand, type BrandTokens } from "../theme/color";

type ThemeState = {
  brandHex: string;
  tokens: BrandTokens;
  setBrand: (hex: string) => void;
};

export const useThemeStore = create<ThemeState>((set) => ({
  brandHex: "#16794c",
  tokens: deriveBrand("#16794c"),
  setBrand: (hex) => set({ brandHex: hex, tokens: deriveBrand(hex) }),
}));

