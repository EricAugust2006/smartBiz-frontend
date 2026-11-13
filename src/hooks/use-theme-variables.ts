import { useEffect, useMemo, type CSSProperties } from "react";
import { useThemeStore } from "@/store/useThemeStore";
import { deriveBrand } from "@/theme/color";

/** Builds CSS custom properties consumed by Tailwind and scoped to ThemeScope. */
export function useThemeVariables(brandHex?: string): CSSProperties {
  const colors = useThemeStore((state) => state.colors);
  const tokens = useThemeStore((state) => state.tokens);

  // Pages Router and App Router can run in separate client bundles. Hydrate
  // from the same saved theme at the point where each ThemeScope is mounted.
  useEffect(() => {
    useThemeStore.getState().sync();
  }, []);

  return useMemo(() => {
    const brand = brandHex ? deriveBrand(brandHex) : tokens;
    const sidebarForeground = deriveBrand(colors.sidebar).fg;
    const headerForeground = deriveBrand(colors.header).fg;
    return {
      "--brand": brand.brand,
      "--brand-fg": brand.fg,
      "--brand-hover": brand.hover,
      "--brand-border": brand.border,
      "--brand-soft": brand.soft,
      "--brand-text": brand.text,
      "--brand-ring": brand.ring,
      "--theme-sidebar": colors.sidebar,
      "--theme-sidebar-foreground": sidebarForeground,
      "--theme-header": colors.header,
      "--theme-header-foreground": headerForeground,
      "--theme-primary": colors.primary,
      "--theme-text": colors.text,
      "--color-foreground": colors.text,
    } as CSSProperties;
  }, [brandHex, colors, tokens]);
}
