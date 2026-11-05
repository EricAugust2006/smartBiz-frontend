"use client";

import {
  createContext,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { QrCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerTitle,
} from "@/components/ui/drawer";
import {
  customerAppearance,
  formatCustomerIdentification,
  type B2CCustomer,
} from "@/lib/customer-dashboard";

const IdentificationContext = createContext<{
  showIdentification: (trigger: HTMLButtonElement) => void;
  available: boolean;
} | null>(null);

export function CustomerIdentificationProvider({
  children,
  customer,
}: {
  children: ReactNode;
  customer: B2CCustomer | null;
}) {
  const [open, setOpen] = useState(false);
  const trigger = useRef<HTMLButtonElement | null>(null);

  function showIdentification(button: HTMLButtonElement) {
    if (!customer) return;
    trigger.current = button;
    setOpen(true);
  }

  return (
    <IdentificationContext.Provider
      value={{ showIdentification, available: Boolean(customer) }}
    >
      <Drawer
        open={open && Boolean(customer)}
        onOpenChange={setOpen}
        shouldScaleBackground={false}
        autoFocus
      >
        {children}
        {customer && (
          <DrawerContent
            brandHex={customerAppearance.brandHex}
            aria-describedby="customer-qr-description"
            onCloseAutoFocus={(event) => {
              event.preventDefault();
              trigger.current?.focus();
            }}
          >
            <div className="overflow-y-auto px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-5 text-center">
              <DrawerTitle className="text-xl font-semibold tracking-tight">
                Meu QR Code
              </DrawerTitle>
              <DrawerDescription
                id="customer-qr-description"
                className="mt-2 text-sm text-muted-foreground"
              >
                Seu cartão do clube, sempre à mão.
              </DrawerDescription>
              <div
                role="img"
                aria-label="QR Code ilustrativo, sem leitura real"
                className="mx-auto my-6 flex aspect-square w-52 max-w-full items-center justify-center rounded-3xl border border-border bg-muted p-4"
              >
                <div className="flex h-full w-full items-center justify-center rounded-2xl bg-card text-foreground">
                  <QrCode size={152} strokeWidth={1.5} aria-hidden="true" />
                </div>
              </div>
              <p className="text-xs font-medium text-muted-foreground">
                QR Code ilustrativo
              </p>
              <p className="mt-3 break-words text-lg font-semibold">
                {customer.name}
              </p>
              <p className="mt-1 text-base tabular-nums text-muted-foreground">
                {formatCustomerIdentification(customer.phone)}
              </p>
              <DrawerClose asChild>
                <Button size="lg" className="mt-6 w-full">
                  Pronto
                </Button>
              </DrawerClose>
            </div>
          </DrawerContent>
        )}
      </Drawer>
    </IdentificationContext.Provider>
  );
}

export function useCustomerIdentification() {
  const showIdentification = useContext(IdentificationContext);
  if (!showIdentification)
    throw new Error("Use a identificação dentro do layout B2C.");
  return showIdentification;
}
