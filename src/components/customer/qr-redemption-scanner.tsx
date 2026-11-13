"use client";

import { useEffect, useId, useRef, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Camera,
  CheckCircle2,
  Loader2,
  QrCode,
  RefreshCw,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { b2cApi, getRequestErrorMessage } from "@/lib/axios";
import { useB2CAuthStore } from "@/store/useB2CAuthStore";

type ScanStatus = "scanning" | "submitting" | "success" | "error";

export function QrRedemptionScanner() {
  const id = useId().replace(/:/g, "");
  const queryClient = useQueryClient();
  const sessionVersion = useB2CAuthStore((state) => state.sessionVersion);
  const [open, setOpen] = useState(false);
  const [retryVersion, setRetryVersion] = useState(0);
  const [status, setStatus] = useState<ScanStatus>("scanning");
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);
  const scanLock = useRef(false);
  const submitPayload = useRef<(payload: string) => void>(() => undefined);

  const redemption = useMutation({
    mutationKey: ["b2c", "scan", sessionVersion],
    retry: false,
    mutationFn: async (payload: string): Promise<void> => {
      await b2cApi.post("/b2c/scan", { payload });
    },
    onSuccess: () => {
      setStatus("success");
      void queryClient.invalidateQueries({ queryKey: ["b2c", "dashboard"] });
    },
    onError: (error) => {
      setScanError(
        getRequestErrorMessage(
          error,
          "Não foi possível resgatar este QR Code. Confira se ele ainda está válido e tente novamente.",
        ),
      );
      setStatus("error");
    },
  });

  submitPayload.current = (payload) => {
    setStatus("submitting");
    redemption.mutate(payload);
  };

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    let scanner: import("html5-qrcode").Html5Qrcode | null = null;
    setStatus("scanning");
    setCameraError(null);
    setScanError(null);
    scanLock.current = false;

    async function startCamera() {
      try {
        const { Html5Qrcode } = await import("html5-qrcode");
        if (cancelled) return;
        scanner = new Html5Qrcode(id);
        const activeScanner = scanner;
        await activeScanner.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 240, height: 240 } },
          (decodedText) => {
            if (scanLock.current) return;
            scanLock.current = true;
            const submit = () => {
              if (!cancelled) submitPayload.current(decodedText);
            };
            if (activeScanner.isScanning) {
              void activeScanner
                .stop()
                .catch(() => undefined)
                .finally(submit);
            } else {
              submit();
            }
          },
          () => undefined,
        );
        if (cancelled && activeScanner.isScanning) {
          await activeScanner.stop();
          await activeScanner.clear();
        }
      } catch {
        if (!cancelled) {
          setCameraError(
            "Não foi possível abrir a câmera. Permita o acesso à câmera e use uma conexão segura (HTTPS).",
          );
          setStatus("error");
        }
      }
    }

    void startCamera();
    return () => {
      cancelled = true;
      const activeScanner = scanner;
      if (!activeScanner) return;
      if (activeScanner.isScanning) {
        void activeScanner
          .stop()
          .then(() => activeScanner.clear())
          .catch(() => undefined);
      } else {
        try {
          activeScanner.clear();
        } catch {
          // The scanner can be disposed before its camera initializes.
        }
      }
    };
  }, [id, open, retryVersion]);

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) {
      redemption.reset();
      setStatus("scanning");
      setCameraError(null);
      setScanError(null);
    }
  }

  function retryScan() {
    redemption.reset();
    setCameraError(null);
    setScanError(null);
    setStatus("scanning");
    setRetryVersion((value) => value + 1);
  }

  return (
    <>
      <Button
        type="button"
        size="lg"
        onClick={() => setOpen(true)}
        className="h-14 w-full justify-start rounded-2xl bg-primary text-primary-foreground shadow-card"
      >
        <Camera size={21} className="shrink-0" aria-hidden="true" />
        <span className="flex-1 text-left text-base">
          Resgatar compra com QR Code
        </span>
        <QrCode size={19} aria-hidden="true" />
      </Button>

      <Dialog.Root open={open} onOpenChange={handleOpenChange}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-40 bg-overlay data-[state=open]:animate-fade-in" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-50 max-h-[90dvh] w-[calc(100vw-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border border-border bg-card p-6 text-foreground shadow-overlay outline-none sm:p-7">
            <Dialog.Close asChild>
              <button
                type="button"
                aria-label="Fechar scanner"
                className="absolute right-3 top-3 rounded-lg p-2 text-muted-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <X size={18} aria-hidden="true" />
              </button>
            </Dialog.Close>
            <div className="text-center">
              <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-soft text-primary-text">
                <Camera size={23} aria-hidden="true" />
              </span>
              <Dialog.Title className="mt-4 text-xl font-semibold tracking-tight">
                Escanear QR Code
              </Dialog.Title>
              <Dialog.Description className="mt-2 text-sm text-muted-foreground">
                Aponte a câmera para o QR Code de resgate exibido no caixa.
              </Dialog.Description>
            </div>

            <div className="relative mt-5 min-h-64 overflow-hidden rounded-2xl border border-border bg-muted">
              <div id={id} className="qr-reader min-h-64 w-full" />
              {status === "submitting" && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-background/90 text-sm font-medium">
                  <Loader2
                    size={24}
                    className="animate-spin text-primary-text"
                    aria-hidden="true"
                  />
                  Validando e resgatando pontos…
                </div>
              )}
              {status === "success" && (
                <div
                  role="status"
                  className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-background p-5 text-center"
                >
                  <CheckCircle2
                    size={44}
                    className="text-success"
                    aria-hidden="true"
                  />
                  <p className="text-lg font-semibold">Pontos resgatados!</p>
                  <p className="text-sm text-muted-foreground">
                    Sua compra foi registrada no clube.
                  </p>
                </div>
              )}
              {status === "error" && (
                <div
                  role="alert"
                  className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-background p-5 text-center"
                >
                  <p className="text-sm text-destructive">
                    {cameraError ?? scanError}
                  </p>
                  <Button type="button" variant="outline" onClick={retryScan}>
                    <RefreshCw size={16} aria-hidden="true" /> Tentar novamente
                  </Button>
                </div>
              )}
            </div>
            {status === "scanning" && (
              <p
                className="mt-3 text-center text-xs text-muted-foreground"
                role="status"
                aria-live="polite"
              >
                Câmera ativa. Enquadre o código dentro da área de leitura.
              </p>
            )}
            {status === "success" && (
              <Button
                type="button"
                size="lg"
                className="mt-5 w-full"
                onClick={() => handleOpenChange(false)}
              >
                Concluir
              </Button>
            )}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}
