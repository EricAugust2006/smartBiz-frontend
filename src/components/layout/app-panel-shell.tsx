"use client";

import {
  Suspense,
  useCallback,
  useEffect,
  useRef,
  useState,
  type MouseEvent,
  type ReactNode,
} from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Loader2, LogOut, Menu } from "lucide-react";
import { PANEL_NAV } from "@/components/layout/panel-navigation";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { Button } from "@/components/ui/button";
import { LoadingFeedback } from "@/components/ui/loading-feedback";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/useAuthStore";

function PanelNavigation({
  onNavigate,
  onPendingHref,
  pendingHref,
}: {
  onNavigate?: () => void;
  onPendingHref: (href: string) => void;
  pendingHref: string | null;
}) {
  const pathname = usePathname() ?? "";
  const router = useRouter();
  const tenant = useAuthStore((state) => state.tenant);
  const user = useAuthStore((state) => state.user);
  const clearSession = useAuthStore((state) => state.clearSession);

  return (
    <div className="flex h-full flex-col gap-6 text-white">
      <div className="flex items-center justify-between gap-2 px-3 pt-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{tenant?.name}</p>
          <p className="text-xs text-white/60">SmartBiz AI</p>
        </div>
        <ThemeToggle />
      </div>
      <nav aria-label="Principal" className="space-y-1">
        {PANEL_NAV.map(({ to, label, icon: Icon, end }) => {
          const active = end ? pathname === to : pathname.startsWith(to);
          return (
            <Link
              key={to}
              href={to}
              prefetch={true}
              onClick={(event) => {
                const isPlainClick =
                  event.button === 0 &&
                  !event.metaKey &&
                  !event.ctrlKey &&
                  !event.shiftKey &&
                  !event.altKey;
                if (isPlainClick) {
                  const destination = new URL(to, window.location.href);
                  const destinationHref = `${destination.pathname}${destination.search}`;
                  const currentHref = `${pathname}${window.location.search}`;
                  if (destinationHref !== currentHref) onPendingHref(to);
                }
                onNavigate?.();
              }}
              aria-current={active ? "page" : undefined}
              aria-busy={pendingHref === to || undefined}
              className={cn(
                "flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium outline-none focus-visible:ring-2 focus-visible:ring-ring",
                active
                  ? "bg-primary text-primary-foreground"
                  : "text-sidebar-foreground/75 hover:bg-sidebar-foreground/10 hover:text-sidebar-foreground",
              )}
            >
              <Icon size={18} aria-hidden="true" />
              <span className="min-w-0 flex-1 truncate">{label}</span>
              {pendingHref === to && (
                <span className="flex shrink-0 items-center gap-1 text-[11px] text-sidebar-foreground/70">
                  <Loader2 size={13} className="animate-spin" aria-hidden="true" />
                  <span>Carregando...</span>
                </span>
              )}
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto border-t border-white/15 pt-4">
        <p className="truncate px-3 text-sm font-medium">{user?.name}</p>
        <Button
          type="button"
          variant="ghost"
          className="mt-2 w-full justify-start text-white/70 hover:bg-white/10 hover:text-white"
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

function PendingNavigationNotice({
  pendingHref,
  onRouteChange,
}: {
  pendingHref: string | null;
  onRouteChange: () => void;
}) {
  const pathname = usePathname() ?? "";
  const searchParams = useSearchParams();
  const query = searchParams?.toString() ?? "";
  const routeKey = `${pathname}${query ? `?${query}` : ""}`;
  const previousRouteKey = useRef(routeKey);
  const [delayElapsed, setDelayElapsed] = useState(false);

  useEffect(() => {
    if (previousRouteKey.current === routeKey) return;
    previousRouteKey.current = routeKey;
    onRouteChange();
  }, [onRouteChange, routeKey]);

  useEffect(() => {
    if (!pendingHref) {
      setDelayElapsed(false);
      return;
    }

    setDelayElapsed(false);
    const timeout = window.setTimeout(() => setDelayElapsed(true), 120);
    return () => window.clearTimeout(timeout);
  }, [pendingHref]);

  if (!pendingHref || !delayElapsed) return null;

  return (
    <div className="mb-5 rounded-xl border border-border bg-card px-4 py-3 shadow-card">
      <LoadingFeedback />
    </div>
  );
}

export function AppPanelShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [pendingHref, setPendingHref] = useState<string | null>(null);
  const tenant = useAuthStore((state) => state.tenant);
  const clearPendingHref = useCallback(() => setPendingHref(null), []);

  return (
    <>
      <aside
        aria-label="Navegação do painel"
        className="fixed bottom-4 left-4 top-4 z-30 hidden w-64 rounded-2xl border border-white/10 bg-sidebar p-3 shadow-float lg:block"
      >
        <PanelNavigation
          pendingHref={pendingHref}
          onPendingHref={setPendingHref}
        />
      </aside>
      <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-border bg-header px-4 text-header-foreground dark:bg-card dark:text-foreground lg:hidden">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Abrir menu">
              <Menu size={20} aria-hidden="true" />
            </Button>
          </SheetTrigger>
          <SheetContent className="border-white/10 bg-sidebar text-white">
            <SheetTitle className="sr-only">Menu do painel</SheetTitle>
            <SheetDescription className="sr-only">
              Navegue entre as áreas da loja.
            </SheetDescription>
            <PanelNavigation
              pendingHref={pendingHref}
              onPendingHref={setPendingHref}
              onNavigate={() => setOpen(false)}
            />
          </SheetContent>
        </Sheet>
        <span className="truncate text-sm font-semibold">{tenant?.name}</span>
      </header>
      <main className="min-w-0 px-4 py-6 sm:px-6 lg:py-8 lg:pl-76 lg:pr-8">
        <Suspense fallback={null}>
          <PendingNavigationNotice
            pendingHref={pendingHref}
            onRouteChange={clearPendingHref}
          />
        </Suspense>
        {children}
      </main>
    </>
  );
}
