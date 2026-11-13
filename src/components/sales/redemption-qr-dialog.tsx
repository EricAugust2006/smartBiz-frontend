"use client";

import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Check, Copy, QrCode, X } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { Button } from "@/components/ui/button";
import { dashboardDateTimeFormatter } from "@/lib/dashboard-metrics";

export type RedemptionDetails = { url: string; expiresAt: string };

export function RedemptionQrDialog({
  redemption,
  onOpenChange,
}: {
  redemption: RedemptionDetails | null;
  onOpenChange: (open: boolean) => void;
}) {
  const [copied, setCopied] = useState(false);

  async function copyUrl() {
    if (!redemption) return;
    try {
      await navigator.clipboard.writeText(redemption.url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }

  return (
    <Dialog.Root open={Boolean(redemption)} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-overlay data-[state=open]:animate-fade-in" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 max-h-[90dvh] w-[calc(100vw-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border border-border bg-card p-6 text-foreground shadow-overlay outline-none sm:p-7">
          <Dialog.Close asChild>
            <button
              type="button"
              aria-label="Fechar QR Code"
              className="absolute right-3 top-3 rounded-lg p-2 text-muted-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <X size={18} aria-hidden="true" />
            </button>
          </Dialog.Close>
          <div className="text-center">
            <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-soft text-primary-text">
              <QrCode size={24} aria-hidden="true" />
            </span>
            <Dialog.Title className="mt-4 text-xl font-semibold tracking-tight">
              QR Code para resgate
            </Dialog.Title>
            <Dialog.Description className="mt-2 text-sm text-muted-foreground">
              Mostre este código ao cliente para que ele resgate os pontos no
              aplicativo.
            </Dialog.Description>
          </div>
          {redemption && (
            <>
              <div className="mx-auto my-5 flex w-fit items-center justify-center rounded-2xl border border-border bg-white p-4">
                <QRCodeSVG
                  value={redemption.url}
                  size={240}
                  level="M"
                  marginSize={2}
                  aria-label="QR Code para resgate da venda"
                />
              </div>
              <p className="text-center text-xs text-muted-foreground">
                Válido até{" "}
                {dashboardDateTimeFormatter.format(
                  new Date(redemption.expiresAt),
                )}
              </p>
              <a
                href={redemption.url}
                className="mt-3 block break-all text-center text-xs text-primary-text underline underline-offset-4"
                target="_blank"
                rel="noreferrer"
              >
                {redemption.url}
              </a>
              <div className="mt-5 flex flex-wrap justify-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => void copyUrl()}
                >
                  {copied ? (
                    <Check size={16} aria-hidden="true" />
                  ) : (
                    <Copy size={16} aria-hidden="true" />
                  )}
                  {copied ? "Link copiado" : "Copiar link"}
                </Button>
                <Dialog.Close asChild>
                  <Button type="button">Concluir</Button>
                </Dialog.Close>
              </div>
            </>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
