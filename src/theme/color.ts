// Contrast-aware brand derivation. One input hex -> every brand token.
const WHITE = "#ffffff";
const INK = "#18181b";

type RGB = [number, number, number];

export function normalizeHex(input: string): string | null {
  let h = input.trim().replace(/^#/, "");
  if (/^[0-9a-f]{3}$/i.test(h)) h = h.split("").map((c) => c + c).join("");
  if (!/^[0-9a-f]{6}$/i.test(h)) return null;
  return "#" + h.toLowerCase();
}

function toRgb(hex: string): RGB {
  const h = hex.replace("#", "");
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)) as RGB;
}

function toHex([r, g, b]: RGB): string {
  return "#" + [r, g, b].map((v) => Math.round(v).toString(16).padStart(2, "0")).join("");
}

export function mix(a: string, b: string, t: number): string {
  const A = toRgb(a);
  const B = toRgb(b);
  return toHex([0, 1, 2].map((i) => A[i] + (B[i] - A[i]) * t) as RGB);
}

function luminance(hex: string): number {
  const [r, g, b] = toRgb(hex).map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

function darkenUntil(hex: string, against: string, target: number): string {
  let out = hex;
  let t = 0;
  while (contrast(out, against) < target && t < 1) {
    t += 0.04;
    out = mix(hex, INK, t);
  }
  return out;
}

export type BrandTokens = {
  brand: string;
  fg: string;
  hover: string;
  border: string;
  soft: string;
  text: string;
  ring: string;
  isLight: boolean;
  textAdjusted: boolean;
  ratios: { label: number; accent: number; edge: number };
};

export function deriveBrand(input: string): BrandTokens {
  const brand = normalizeHex(input) ?? INK;
  const onWhite = contrast(brand, WHITE);
  // Near-white brands can't carry fills on a white UI: ink takes the accent role.
  const isLight = onWhite < 1.35;

  const fg = contrast(brand, WHITE) >= contrast(brand, INK) ? WHITE : INK;
  const soft = isLight ? "#f1f1f3" : mix(brand, WHITE, 0.9);
  const textRaw = isLight ? INK : darkenUntil(brand, WHITE, 4.5);
  const text = darkenUntil(textRaw, soft, 4.5);
  const border = isLight ? INK : onWhite >= 3 ? brand : darkenUntil(brand, WHITE, 3);
  const hover = isLight
    ? "#f1f1f3"
    : luminance(brand) < 0.03
      ? mix(brand, WHITE, 0.14)
      : mix(brand, INK, 0.12);

  return {
    brand,
    fg,
    hover,
    border,
    soft,
    text,
    ring: text,
    isLight,
    textAdjusted: text !== brand,
    ratios: {
      label: contrast(brand, fg),
      accent: contrast(text, WHITE),
      edge: contrast(border, WHITE),
    },
  };
}

export const BRAND_PRESETS = [
  { id: "azul", name: "Azul", hex: "#2563eb" },
  { id: "vermelho", name: "Vermelho", hex: "#d62d20" },
  { id: "verde", name: "Verde", hex: "#16794c" },
  { id: "ambar", name: "Âmbar", hex: "#f2a516" },
  { id: "preto", name: "Preto", hex: "#18181b" },
  { id: "branco", name: "Branco", hex: "#ffffff" },
] as const;

