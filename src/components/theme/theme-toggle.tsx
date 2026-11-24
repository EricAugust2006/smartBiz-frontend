"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/components/theme/theme-provider";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";
  const label = isDark ? "Ativar modo claro" : "Ativar modo escuro";
  const Icon = isDark ? Sun : Moon;

  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={toggleTheme}
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-zinc-200 transition-colors hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <Icon size={17} strokeWidth={1.8} aria-hidden="true" />
    </button>
  );
}
