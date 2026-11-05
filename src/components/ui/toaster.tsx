"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast";

type ToastMessage = { title: string; description?: string };
const ToastContext = createContext<((message: ToastMessage) => void) | null>(
  null,
);

export function ToasterProvider({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState<
    (ToastMessage & { id: number }) | null
  >(null);
  const [open, setOpen] = useState(false);

  function toast(nextMessage: ToastMessage) {
    setMessage((previous) => ({ ...nextMessage, id: (previous?.id ?? 0) + 1 }));
    setOpen(true);
  }

  return (
    <ToastContext.Provider value={toast}>
      <ToastProvider duration={5000}>
        {children}
        {message && (
          <Toast key={message.id} open={open} onOpenChange={setOpen}>
            <div>
              <ToastTitle>{message.title}</ToastTitle>
              {message.description && (
                <ToastDescription>{message.description}</ToastDescription>
              )}
            </div>
            <ToastClose />
          </Toast>
        )}
        <ToastViewport />
      </ToastProvider>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const toast = useContext(ToastContext);
  if (!toast)
    throw new Error("useToast deve ser usado dentro de ToasterProvider.");
  return { toast };
}
