"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut, Menu } from "lucide-react";
import { PANEL_NAV } from "@/components/layout/panel-navigation";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/useAuthStore";

function PanelNavigation({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname() ?? "";
  const router = useRouter();
  const tenant = useAuthStore((state) => state.tenant);
  const user = useAuthStore((state) => state.user);
  const clearSession = useAuthStore((state) => state.clearSession);

  return (
    <div className="flex h-full flex-col gap-6">
      <div className="min-w-0 px-3 pt-3 pr-9">
        <p className="truncate text-sm font-semibold">{tenant?.name}</p>
        <p className="text-xs text-muted-foreground">SmartBiz AI</p>
      </div>
      <nav aria-label="Principal" className="space-y-1">
        {PANEL_NAV.map(({ to, label, icon: Icon, end }) => {
          const active = end ? pathname === to : pathname.startsWith(to);
          return (
            <Link
              key={to}
              href={to}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium outline-none focus-visible:ring-2 focus-visible:ring-ring",
                active
                  ? "bg-primary-soft text-primary-text"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <Icon size={18} aria-hidden="true" />
              {label}
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto border-t border-border pt-4">
        <p className="truncate px-3 text-sm font-medium">{user?.name}</p>
        <Button
          type="button"
          variant="ghost"
          className="mt-2 w-full justify-start"
          onClick={() => {
            clearSession();
            router.replace("/login");
          }}
        >
          <LogOut size={18} aria-hidden="true" />
          Sair
        </Button>
      </div>
    </div>
  );
}

export function AppPanelShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const tenant = useAuthStore((state) => state.tenant);

  return (
    <>
      <aside
        aria-label="Navegação do painel"
        className="fixed bottom-4 left-4 top-4 z-30 hidden w-64 rounded-2xl border border-border bg-card p-3 shadow-float lg:block"
      >
        <PanelNavigation />
      </aside>
      <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-border bg-card px-4 lg:hidden">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Abrir menu">
              <Menu size={20} aria-hidden="true" />
            </Button>
          </SheetTrigger>
          <SheetContent>
            <SheetTitle className="sr-only">Menu do painel</SheetTitle>
            <SheetDescription className="sr-only">
              Navegue entre as áreas da loja.
            </SheetDescription>
            <PanelNavigation onNavigate={() => setOpen(false)} />
          </SheetContent>
        </Sheet>
        <span className="truncate text-sm font-semibold">{tenant?.name}</span>
      </header>
      <main className="min-w-0 px-4 py-6 sm:px-6 lg:py-8 lg:pl-76 lg:pr-8">
        {children}
      </main>
    </>
  );
}
