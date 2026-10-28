import { useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { Crown, LayoutDashboard, LogOut, Menu, MessagesSquare, Package, Settings, Smartphone, X } from "lucide-react";
import { Avatar, Button, TenantMark, ThemeScope, Toaster, cn } from "../ui";
import { tenant } from "../../data";

const NAV = [
  { to: "/painel", label: "Início", icon: LayoutDashboard, end: true },
  { to: "/painel/copiloto", label: "Copiloto", icon: MessagesSquare, end: false },
  { to: "/painel/estoque", label: "Estoque", icon: Package, end: false },
  { to: "/painel/clube", label: "Clube VIP", icon: Crown, end: false },
  { to: "/painel/configuracoes", label: "Configurações", icon: Settings, end: false },
];

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const router = useRouter();
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 px-4 pt-5 pb-6">
        <TenantMark />
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold tracking-tight">{tenant.name}</p>
          <p className="text-xs text-muted-foreground">SmartBiz AI</p>
        </div>
      </div>

      <nav aria-label="Principal" className="flex flex-col gap-1 px-3">
        {NAV.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.to}
              href={item.to}
              onClick={onNavigate}
              className={cn(
                  "flex h-10 items-center gap-3 rounded-lg px-3 text-sm font-medium outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  (item.end ? router.pathname === item.to : router.pathname.startsWith(item.to)) ? "bg-primary-soft text-primary-text" : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
            >
              <Icon size={18} strokeWidth={1.75} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto flex flex-col gap-1 px-3 pb-3">
        <Link
          href={`/c/${tenant.slug}`}
          className="flex h-10 items-center gap-3 rounded-lg px-3 text-sm font-medium text-muted-foreground outline-none hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Smartphone size={18} strokeWidth={1.75} />
          App do cliente
        </Link>
        <div className="mt-2 flex items-center gap-3 border-t border-border px-1 pt-4">
          <Avatar initials={tenant.owner.initials} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{tenant.owner.name}</p>
            <p className="text-xs text-muted-foreground">{tenant.owner.role}</p>
          </div>
          <Link
            href="/entrar"
            aria-label="Sair"
            title="Sair"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground outline-none hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
          >
            <LogOut size={16} strokeWidth={1.75} />
          </Link>
        </div>
      </div>
    </div>
  );
}

export function DashboardLayout({ children, initialMenuOpen = false }: { children: ReactNode; initialMenuOpen?: boolean }) {
  const [open, setOpen] = useState(initialMenuOpen);
  const [anim, setAnim] = useState(true);

  return (
    <ThemeScope>
      {/* Floating sidebar: desktop */}
      <aside className="fixed top-4 bottom-4 left-4 z-30 hidden w-64 rounded-2xl border border-border bg-card shadow-float lg:block">
        <SidebarContent />
      </aside>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-border bg-card px-4 lg:hidden">
        <Button variant="ghost" size="icon" aria-label="Abrir menu" onClick={() => { setAnim(true); setOpen(true); }}>
          <Menu size={20} strokeWidth={1.75} />
        </Button>
        <TenantMark size="sm" />
        <span className="text-sm font-semibold tracking-tight">{tenant.name}</span>
      </header>

      {/* Mobile sheet */}
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 animate-fade-in bg-overlay" onClick={() => setOpen(false)} />
          <aside
            onAnimationEnd={() => setAnim(false)}
            className={cn(
              "absolute top-3 bottom-3 left-3 w-72 rounded-2xl border border-border bg-card shadow-overlay",
              anim && "animate-sheet-left",
            )}
          >
            <Button variant="ghost" size="icon" aria-label="Fechar menu" onClick={() => setOpen(false)} className="absolute top-4 right-3">
              <X size={18} strokeWidth={1.75} />
            </Button>
            <SidebarContent onNavigate={() => setOpen(false)} />
          </aside>
        </div>
      )}

      <main className="px-4 py-6 sm:px-6 lg:py-8 lg:pr-8 lg:pl-76">{children}</main>
      <Toaster />
    </ThemeScope>
  );
}

export function PageHeader({ title, meta, action }: { title: string; meta?: ReactNode; action?: ReactNode }) {
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

