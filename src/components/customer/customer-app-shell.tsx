"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Heart, Home, LogOut, QrCode, Target } from "lucide-react";
import {
  CustomerIdentificationProvider,
  useCustomerIdentification,
} from "@/components/customer/customer-identification";
import { ThemeScope } from "@/components/ui";
import { cn } from "@/lib/utils";
import { customerAppearance, type B2CCustomer } from "@/lib/customer-dashboard";
import { useB2CAuthStore } from "@/store/useB2CAuthStore";
import { Button } from "@/components/ui/button";

function CustomerBottomNavigation() {
  const { showIdentification, available } = useCustomerIdentification();
  const [active, setActive] = useState("inicio");

  useEffect(() => {
    const update = () =>
      setActive(window.location.hash === "#missoes" ? "missoes" : "inicio");
    update();
    window.addEventListener("hashchange", update);
    return () => window.removeEventListener("hashchange", update);
  }, []);

  const itemClass =
    "flex min-h-14 flex-col items-center justify-center gap-1 rounded-2xl text-xs font-medium outline-none focus-visible:ring-2 focus-visible:ring-ring";

  return (
    <nav
      aria-label="Navegação do cliente"
      className="fixed inset-x-0 bottom-0 z-20 mx-auto w-full max-w-md border-t border-border bg-card px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2"
    >
      <ul className="grid grid-cols-3 gap-2">
        {[
          { id: "inicio", label: "Início", icon: Home },
          { id: "missoes", label: "Missões", icon: Target },
        ].map(({ id, label, icon: Icon }) => (
          <li key={id}>
            <a
              href={`#${id}`}
              aria-current={active === id ? "location" : undefined}
              onClick={() => setActive(id)}
              className={cn(
                itemClass,
                active === id
                  ? "bg-primary-soft text-primary-text"
                  : "text-muted-foreground hover:bg-muted",
              )}
            >
              <Icon size={21} aria-hidden="true" />
              {label}
            </a>
          </li>
        ))}
        <li>
          <button
            type="button"
            aria-label="Abrir meu QR Code"
            aria-haspopup="dialog"
            disabled={!available}
            onClick={(event) => showIdentification(event.currentTarget)}
            className={cn(
              itemClass,
              "w-full text-muted-foreground hover:bg-muted",
            )}
          >
            <QrCode size={21} aria-hidden="true" />
            QR Code
          </button>
        </li>
      </ul>
    </nav>
  );
}

export function CustomerAppShell({
  children,
  customer = null,
  showNavigation = false,
}: {
  children: ReactNode;
  customer?: B2CCustomer | null;
  showNavigation?: boolean;
}) {
  const clearSession = useB2CAuthStore((state) => state.clearSession);

  return (
    <ThemeScope brandHex={customerAppearance.brandHex} className="min-h-dvh">
      <CustomerIdentificationProvider customer={customer}>
        <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col bg-background">
          <header className="sticky top-0 z-10 border-b border-border bg-card pt-[env(safe-area-inset-top)]">
            <div className="flex min-h-18 items-center gap-3 px-5 py-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary-soft text-primary-text">
                <Heart size={22} aria-hidden="true" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-muted-foreground">
                  Seu clube de vantagens
                </p>
                <p className="truncate text-sm font-semibold">
                  {customerAppearance.title}
                </p>
              </div>
              {customer && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label="Sair do App do Cliente"
                  onClick={() => clearSession()}
                >
                  <LogOut size={18} aria-hidden="true" />
                </Button>
              )}
            </div>
          </header>
          <main className="flex-1 px-5 pb-[calc(7rem+env(safe-area-inset-bottom))] pt-5">
            {children}
          </main>
          {showNavigation && <CustomerBottomNavigation />}
        </div>
      </CustomerIdentificationProvider>
    </ThemeScope>
  );
}
