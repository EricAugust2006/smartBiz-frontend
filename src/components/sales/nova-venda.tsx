"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { v4 as uuidv4 } from "uuid";
import { Check, Loader2, ReceiptText, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toaster";
import { useCustomerByPhone } from "@/hooks/use-customer-by-phone";
import { api, getRequestErrorMessage } from "@/lib/axios";
import {
  currencyFormatter,
  customerPhoneSchema,
  formatCustomerPhone,
  formatSaleAmount,
  normalizeCustomerPhone,
  saleFormSchema,
  type CreateSaleInput,
  type SaleFormInput,
  type SaleFormValues,
} from "@/lib/sales";
import { useAuthStore } from "@/store/useAuthStore";

const defaultValues: SaleFormInput = { amount: "", customerPhone: "" };

export function NovaVenda() {
  const id = useId();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const tenantId = useAuthStore((state) => state.tenant?.id);
  const accessToken = useAuthStore((state) => state.accessToken);
  const userId = useAuthStore((state) => state.user?.id);
  const [lookupPhone, setLookupPhone] = useState("");
  const customer = useCustomerByPhone(lookupPhone);
  const submissionLock = useRef(false);
  const pendingSale = useRef<(CreateSaleInput & { tenantId: string }) | null>(
    null,
  );
  const form = useForm<SaleFormInput, unknown, SaleFormValues>({
    resolver: zodResolver(saleFormSchema),
    defaultValues,
    mode: "onTouched",
  });

  const sale = useMutation({
    mutationKey: ["sales", tenantId, userId, "create"],
    retry: false,
    mutationFn: async (payload: CreateSaleInput): Promise<void> => {
      await api.post("/sales", payload);
    },
    onSuccess: (_data, payload) => {
      pendingSale.current = null;
      setLookupPhone("");
      form.reset(defaultValues);
      toast({
        title: "Venda confirmada!",
        description: `${currencyFormatter.format(payload.amount)} registrados com sucesso.`,
      });
      void queryClient.invalidateQueries({ queryKey: ["sales", tenantId] });
      void queryClient.invalidateQueries({ queryKey: ["customers", tenantId] });
    },
  });

  const busy = form.formState.isSubmitting || sale.isPending;
  const canSell = Boolean(tenantId && accessToken);
  const errors = form.formState.errors;
  const { setFocus } = form;

  useEffect(() => {
    // Wait for React to enable the inputs before focusing the next sale.
    if (sale.isSuccess && !busy) setFocus("amount");
  }, [sale.isSuccess, busy, setFocus]);

  async function onSubmit(values: SaleFormValues) {
    if (submissionLock.current || !tenantId || !accessToken) return;
    submissionLock.current = true;

    try {
      const previous = pendingSale.current;
      // Reuse the key after a timeout/error when retrying the same sale.
      const idempotencyKey =
        previous?.tenantId === tenantId &&
        previous.amount === values.amount &&
        previous.customerPhone === values.customerPhone
          ? previous.idempotencyKey
          : uuidv4();
      const payload: CreateSaleInput = { ...values, idempotencyKey };
      pendingSale.current = { ...payload, tenantId };
      await sale.mutateAsync(payload);
    } catch {
      // Keep the form and idempotency key so the cashier can retry safely.
    } finally {
      submissionLock.current = false;
    }
  }

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader className="border-b border-border p-5 sm:p-6">
        <div className="mb-2 flex h-11 w-11 items-center justify-center rounded-xl bg-primary-soft text-primary-text">
          <ReceiptText size={22} aria-hidden="true" />
        </div>
        <CardTitle>Nova Venda</CardTitle>
        <CardDescription>
          PDV Rápido · Registre a compra com o valor e o telefone do cliente.
        </CardDescription>
      </CardHeader>

      <CardContent className="p-5 sm:p-6">
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          noValidate
          aria-busy={busy}
          className="space-y-6"
        >
          <div className="space-y-2">
            <Label htmlFor={`${id}-amount`}>Valor da Venda (R$)</Label>
            <Controller
              name="amount"
              control={form.control}
              render={({ field }) => (
                <Input
                  {...field}
                  id={`${id}-amount`}
                  value={formatSaleAmount(field.value)}
                  inputMode="numeric"
                  autoComplete="off"
                  placeholder="R$ 0,00"
                  disabled={busy}
                  aria-invalid={Boolean(errors.amount)}
                  aria-describedby={
                    errors.amount ? `${id}-amount-error` : undefined
                  }
                  className="h-16 text-2xl font-semibold tabular-nums sm:text-3xl"
                  onChange={(event) => {
                    const cents = event.target.value
                      .replace(/\D/g, "")
                      .replace(/^0+(?=\d)/, "");
                    if (cents.length <= 15) {
                      field.onChange(cents);
                      sale.reset();
                    }
                  }}
                />
              )}
            />
            {errors.amount && (
              <p
                id={`${id}-amount-error`}
                role="alert"
                className="text-sm text-destructive"
              >
                {errors.amount.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor={`${id}-phone`}>Telefone do Cliente</Label>
            <Controller
              name="customerPhone"
              control={form.control}
              render={({ field }) => (
                <Input
                  {...field}
                  id={`${id}-phone`}
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel-national"
                  placeholder="(11) 99999-9999"
                  value={formatCustomerPhone(field.value)}
                  disabled={busy}
                  aria-invalid={Boolean(errors.customerPhone)}
                  aria-describedby={`${id}-customer${errors.customerPhone ? ` ${id}-phone-error` : ""}`}
                  onChange={(event) => {
                    field.onChange(normalizeCustomerPhone(event.target.value));
                    setLookupPhone("");
                    sale.reset();
                  }}
                  onBlur={() => {
                    field.onBlur();
                    setLookupPhone(
                      customerPhoneSchema.safeParse(field.value).success
                        ? field.value
                        : "",
                    );
                  }}
                />
              )}
            />
            {errors.customerPhone && (
              <p
                id={`${id}-phone-error`}
                role="alert"
                className="text-sm text-destructive"
              >
                {errors.customerPhone.message}
              </p>
            )}

            <div
              id={`${id}-customer`}
              role="status"
              aria-live="polite"
              aria-atomic="true"
              className="min-h-6 text-sm"
            >
              {lookupPhone && customer.isLoading ? (
                <div className="flex items-center gap-2">
                  <Skeleton className="h-4 w-4 rounded-full" />
                  <Skeleton className="h-4 w-40" />
                  <span className="sr-only">Buscando cliente…</span>
                </div>
              ) : lookupPhone && customer.isError ? (
                <div className="space-y-1 text-muted-foreground">
                  <p>
                    {getRequestErrorMessage(
                      customer.error,
                      "Não foi possível consultar o cliente. Você pode confirmar a venda com este telefone.",
                    )}
                  </p>
                  <Button
                    type="button"
                    variant="ghost"
                    className="h-9 px-0 text-primary-text"
                    disabled={customer.isFetching || busy}
                    onClick={() => {
                      void customer.refetch();
                    }}
                  >
                    Tentar consultar novamente
                  </Button>
                </div>
              ) : lookupPhone && customer.isSuccess ? (
                customer.data ? (
                  <p className="flex items-center gap-2 text-foreground">
                    <UserRound size={16} aria-hidden="true" />
                    Cliente:{" "}
                    <span className="font-medium">{customer.data.name}</span>
                  </p>
                ) : (
                  <p className="text-muted-foreground">Novo Cliente</p>
                )
              ) : (
                <p className="text-muted-foreground">
                  Informe o telefone com DDD para identificar o cliente.
                </p>
              )}
            </div>
          </div>

          {sale.isError && (
            <div
              role="alert"
              className="rounded-xl border border-destructive/30 bg-destructive-soft p-3 text-sm text-destructive"
            >
              {getRequestErrorMessage(
                sale.error,
                "Não foi possível confirmar a venda. Confira sua conexão e tente novamente; os dados foram mantidos.",
              )}
            </div>
          )}
          {!canSell && (
            <p role="alert" className="text-sm text-destructive">
              Entre na conta da loja para registrar uma venda.
            </p>
          )}

          <Button
            type="submit"
            size="lg"
            disabled={busy || !canSell}
            className="w-full bg-primary text-primary-foreground"
          >
            {busy ? (
              <Loader2 size={18} className="animate-spin" aria-hidden="true" />
            ) : (
              <Check size={18} aria-hidden="true" />
            )}
            {busy ? "Confirmando venda…" : "Confirmar Venda"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
