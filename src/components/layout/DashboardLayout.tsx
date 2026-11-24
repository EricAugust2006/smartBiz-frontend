import {
  useEffect,
  useState,
  type MouseEvent,
  type ReactNode,
} from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { Loader2, LogOut, Menu, Smartphone, X } from "lucide-react";
import { PANEL_NAV as NAV } from "@/components/layout/panel-navigation";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { Avatar, Button, TenantMark, ThemeScope, Toaster, cn } from "../ui";
import { tenant } from "../../data";
import { useAuthStore } from "../../store/useAuthStore";
import { LoadingFeedback } from "@/components/ui/loading-feedback";

function SidebarContent({
  onNavigate,
  onLinkClick,
  pendingHref,
}: {
  onNavigate?: () => void;
  onLinkClick: (event: MouseEvent<HTMLAnchorElement>, href: string) => void;
  pendingHref: string | null;
}) {
  const router = useRouter();
  const accountTenant = useAuthStore((s) => s.tenant);
  const accountUser = useAuthStore((s) => s.user);
  const clearSession = useAuthStore((s) => s.clearSession);
  const currentTenant = accountTenant ?? tenant;
  return (
    <div className="flex h-full flex-col text-sidebar-foreground">
      <div className="flex items-center justify-between gap-2 px-4 pt-5 pb-6">
        <div className="flex min-w-0 items-center gap-3">
          <TenantMark initial={currentTenant.name.charAt(0)} />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold tracking-tight">
              {currentTenant.name}
            </p>
            <p className="text-xs text-sidebar-foreground/65">SmartBiz AI</p>
          </div>
        </div>
        <ThemeToggle />
      </div>

      <nav aria-label="Principal" className="flex flex-col gap-1 px-3">
        {NAV.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.to}
              href={item.to}
              prefetch={true}
              onClick={(event) => {
                onLinkClick(event, item.to);
                onNavigate?.();
              }}
              aria-busy={pendingHref === item.to || undefined}
              className={cn(
                "flex h-10 items-center gap-3 rounded-lg px-3 text-sm font-medium outline-none focus-visible:ring-2 focus-visible:ring-ring",
                (
                  item.end
                    ? router.pathname === item.to
                    : router.pathname.startsWith(item.to)
                )
                  ? "bg-primary text-primary-foreground"
                  : "text-sidebar-foreground/75 hover:bg-sidebar-foreground/10 hover:text-sidebar-foreground",
              )}
            >
              <Icon size={18} strokeWidth={1.75} />
              <span className="min-w-0 flex-1 truncate">{item.label}</span>
              {pendingHref === item.to && (
                <span className="flex shrink-0 items-center gap-1 text-[11px] text-sidebar-foreground/70">
                  <Loader2 size={13} className="animate-spin" aria-hidden="true" />
                  <span>Carregando...</span>
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto flex flex-col gap-1 px-3 pb-3">
        <Link
          href={`/c/${currentTenant.slug}`}
          prefetch={true}
          onClick={(event) => onLinkClick(event, `/c/${currentTenant.slug}`)}
          aria-busy={pendingHref === `/c/${currentTenant.slug}` || undefined}
          className="flex h-10 items-center gap-3 rounded-lg px-3 text-sm font-medium text-sidebar-foreground/75 outline-none hover:bg-sidebar-foreground/10 hover:text-sidebar-foreground focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Smartphone size={18} strokeWidth={1.75} />
          <span className="min-w-0 flex-1 truncate">App do cliente</span>
          {pendingHref === `/c/${currentTenant.slug}` && (
            <span className="flex shrink-0 items-center gap-1 text-[11px] text-sidebar-foreground/70">
              <Loader2 size={13} className="animate-spin" aria-hidden="true" />
              <span>Carregando...</span>
            </span>
          )}
        </Link>
        <div className="mt-2 flex items-center gap-3 border-t border-sidebar-foreground/15 px-1 pt-4">
          <Avatar
            initials={
              accountUser?.name
                .split(/\s+/)
                .map((part) => part[0])
                .join("")
                .slice(0, 2)
                .toUpperCase() ?? tenant.owner.initials
            }
            className="bg-sidebar-foreground/10 text-sidebar-foreground"
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">
              {accountUser?.name ?? tenant.owner.name}
            </p>
            <p className="text-xs text-sidebar-foreground/65">
              {accountUser?.role === "OWNER"
                ? "Proprietário"
                : (accountUser?.role ?? tenant.owner.role)}
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              clearSession();
              void router.push("/login");
            }}
            aria-label="Sair"
            title="Sair"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-sidebar-foreground/75 outline-none hover:bg-sidebar-foreground/10 hover:text-sidebar-foreground focus-visible:ring-2 focus-visible:ring-ring"
          >
            <LogOut size={16} strokeWidth={1.75} />
          </button>
        </div>
      </div>
    </div>
  );
}

export function DashboardLayout({
  children,
  initialMenuOpen = false,
}: {
  children: ReactNode;
  initialMenuOpen?: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(initialMenuOpen);
  const [anim, setAnim] = useState(true);
  const [pendingHref, setPendingHref] = useState<string | null>(null);
  const [navigationDelayElapsed, setNavigationDelayElapsed] = useState(false);
  const {
    accessToken,
    hydrated,
    user,
    tenant: accountTenant,
    clearSession,
  } = useAuthStore();
  const authenticated = Boolean(accessToken && user && accountTenant);

  useEffect(() => {
    if (router.isReady && hydrated && !authenticated)
      void router.replace("/login");
  }, [authenticated, hydrated, router, router.isReady]);

  useEffect(() => setPendingHref(null), [router.asPath]);

  useEffect(() => {
    if (!pendingHref) {
      setNavigationDelayElapsed(false);
      return;
    }
    setNavigationDelayElapsed(false);
    const timeout = window.setTimeout(
      () => setNavigationDelayElapsed(true),
      120,
    );
    return () => window.clearTimeout(timeout);
  }, [pendingHref]);

  function handleLinkClick(
    event: MouseEvent<HTMLAnchorElement>,
    href: string,
  ) {
    const isPlainClick =
      event.button === 0 &&
      !event.metaKey &&
      !event.ctrlKey &&
      !event.shiftKey &&
      !event.altKey;
    if (!isPlainClick) return;

    const destination = new URL(href, window.location.href);
    const destinationHref = `${destination.pathname}${destination.search}`;
    const currentHref = router.asPath.split("#", 1)[0];
    if (destinationHref !== currentHref) setPendingHref(href);
  }

  if (!router.isReady || !hydrated || !authenticated) {
    return (
      <ThemeScope className="flex items-center justify-center px-6">
        <LoadingFeedback />
      </ThemeScope>
    );
  }

  return (
    <ThemeScope>
      {/* Floating sidebar: desktop */}
      <aside className="fixed top-4 bottom-4 left-4 z-30 hidden w-64 rounded-2xl border border-sidebar-foreground/15 bg-sidebar shadow-float lg:block">
        <SidebarContent
          pendingHref={pendingHref}
          onLinkClick={handleLinkClick}
        />
      </aside>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-border bg-header px-4 text-header-foreground dark:bg-card dark:text-foreground lg:hidden">
        <Button
          variant="ghost"
          size="icon"
          aria-label="Abrir menu"
          onClick={() => {
            setAnim(true);
            setOpen(true);
          }}
        >
          <Menu size={20} strokeWidth={1.75} />
        </Button>
        <TenantMark size="sm" />
        <span className="text-sm font-semibold tracking-tight">
          {accountTenant?.name ?? tenant.name}
        </span>
      </header>

      {/* Mobile sheet */}
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 animate-fade-in bg-overlay"
            onClick={() => setOpen(false)}
          />
          <aside
            onAnimationEnd={() => setAnim(false)}
            className={cn(
              "absolute top-3 bottom-3 left-3 w-72 rounded-2xl border border-sidebar-foreground/15 bg-sidebar shadow-overlay",
              anim && "animate-sheet-left",
            )}
          >
            <Button
              variant="ghost"
              size="icon"
              aria-label="Fechar menu"
              onClick={() => setOpen(false)}
              className="absolute top-4 right-3 text-sidebar-foreground hover:bg-sidebar-foreground/10 hover:text-sidebar-foreground"
            >
              <X size={18} strokeWidth={1.75} />
            </Button>
            <SidebarContent
              pendingHref={pendingHref}
              onLinkClick={handleLinkClick}
              onNavigate={() => setOpen(false)}
            />
          </aside>
        </div>
      )}

      <main className="px-4 py-6 sm:px-6 lg:py-8 lg:pr-8 lg:pl-76">
        {pendingHref && navigationDelayElapsed && (
          <div className="mb-5 rounded-xl border border-border bg-card px-4 py-3 shadow-card">
            <LoadingFeedback />
          </div>
        )}
        {children}
      </main>
      <Toaster />
    </ThemeScope>
  );
}

export function PageHeader({
  title,
  meta,
  action,
}: {
  title: string;
  meta?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="flex items-baseline gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {meta && <span className="text-sm text-muted-foreground">{meta}</span>}
      </div>
      {action}
    </div>
  );
}
