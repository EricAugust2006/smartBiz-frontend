import { create } from "zustand";
import { deriveBrand, normalizeHex, type BrandTokens } from "../theme/color";

export const THEME_STORAGE_KEY = "smartbiz-theme-v1";

export const THEME_TARGETS = [
  {
    id: "sidebar",
    label: "Fundo da sidebar",
    cssVariable: "--theme-sidebar",
    defaultColor: "#262B40",
  },
  {
    id: "header",
    label: "Cabeçalho",
    cssVariable: "--theme-header",
    defaultColor: "#FFFFFF",
  },
  {
    id: "primary",
    label: "Botões primários",
    cssVariable: "--theme-primary",
    defaultColor: "#0474C4",
  },
  {
    id: "text",
    label: "Textos",
    cssVariable: "--theme-text",
    defaultColor: "#2C444C",
  },
] as const;

export type ThemeTarget = (typeof THEME_TARGETS)[number]["id"];
export type ThemeColors = Record<ThemeTarget, string>;

export const DEFAULT_THEME_COLORS: ThemeColors = {
  sidebar: "#262B40",
  header: "#FFFFFF",
  primary: "#0474C4",
  text: "#2C444C",
};

type ThemeState = {
  colors: ThemeColors;
  hydrated: boolean;
  tokens: BrandTokens;
  setColor: (target: ThemeTarget, hex: string) => void;
  setColors: (colors: ThemeColors) => void;
  hydrate: () => void;
  sync: () => void;
  reset: () => void;
};

function save(colors: ThemeColors): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(colors));
  } catch {
    // Keep the in-memory theme usable when browser storage is unavailable.
  }
}

function readSavedColors(): ThemeColors {
  try {
    const parsed: unknown = JSON.parse(
      window.localStorage.getItem(THEME_STORAGE_KEY) ?? "null",
    );
    if (!parsed || typeof parsed !== "object") return DEFAULT_THEME_COLORS;
    const record = parsed as Record<string, unknown>;
    return Object.fromEntries(
      THEME_TARGETS.map(({ id }) => {
        const value =
          typeof record[id] === "string"
            ? normalizeHex(record[id] as string)
            : null;
        return [id, value ?? DEFAULT_THEME_COLORS[id]];
      }),
    ) as ThemeColors;
  } catch {
    return DEFAULT_THEME_COLORS;
  }
}

export const useThemeStore = create<ThemeState>((set) => ({
  colors: DEFAULT_THEME_COLORS,
  hydrated: false,
  tokens: deriveBrand(DEFAULT_THEME_COLORS.primary),
  setColor: (target, input) => {
    const hex = normalizeHex(input);
    if (!hex) return;
    set((state) => {
      const colors = { ...state.colors, [target]: hex };
      save(colors);
      return {
        colors,
        tokens: target === "primary" ? deriveBrand(hex) : state.tokens,
      };
    });
  },
  setColors: (nextColors) => {
    const colors = Object.fromEntries(
      THEME_TARGETS.map(({ id }) => {
        const value = normalizeHex(nextColors[id]);
        return [id, value ?? DEFAULT_THEME_COLORS[id]];
      }),
    ) as ThemeColors;
    save(colors);
    set({ colors, tokens: deriveBrand(colors.primary) });
  },
  hydrate: () => {
    if (typeof window === "undefined") return;
    set((state) => {
      if (state.hydrated) return state;
      const colors = readSavedColors();
      return { colors, tokens: deriveBrand(colors.primary), hydrated: true };
    });
  },
  sync: () => {
    if (typeof window === "undefined") return;
    const colors = readSavedColors();
    set({ colors, tokens: deriveBrand(colors.primary), hydrated: true });
  },
  reset: () => {
    save(DEFAULT_THEME_COLORS);
    set({
      colors: DEFAULT_THEME_COLORS,
      tokens: deriveBrand(DEFAULT_THEME_COLORS.primary),
    });
  },
}));
