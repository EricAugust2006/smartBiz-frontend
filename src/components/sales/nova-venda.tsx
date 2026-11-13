"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { v4 as uuidv4 } from "uuid";
import {
  Check,
  Loader2,
  Minus,
  Plus,
  ReceiptText,
  UserRound,
} from "lucide-react";
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
import {
  RedemptionQrDialog,
  type RedemptionDetails,
} from "@/components/sales/redemption-qr-dialog";
import { useCustomerByPhone } from "@/hooks/use-customer-by-phone";
import { useProducts } from "@/hooks/use-products";
import { api, getRequestErrorMessage } from "@/lib/axios";
import { productPriceInCents, type Product } from "@/lib/products";
import {
  currencyFormatter,
  customerPhoneSchema,
  formatCustomerPhone,
  formatSaleAmount,
  normalizeCustomerPhone,
  saleResponseSchema,
  saleFormSchema,
  type CreateSaleInput,
  type CreateSaleResponse,
  type SaleFormInput,
  type SaleFormValues,
} from "@/lib/sales";
import { useAuthStore } from "@/store/useAuthStore";

const defaultValues: SaleFormInput = { amount: "0", customerPhone: "" };
type CartLine = { product: Product; quantity: number };

export function NovaVenda() {
  const id = useId();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const tenantId = useAuthStore((state) => state.tenant?.id);
  const accessToken = useAuthStore((state) => state.accessToken);
  const userId = useAuthStore((state) => state.user?.id);
  const [lookupPhone, setLookupPhone] = useState("");
  const [productSearch, setProductSearch] = useState("");
  const [cart, setCart] = useState<CartLine[]>([]);
  const [redemption, setRedemption] = useState<RedemptionDetails | null>(null);
  const products = useProducts(productSearch);
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
    mutationFn: async (
      payload: CreateSaleInput,
    ): Promise<CreateSaleResponse> => {
      const { data } = await api.post<unknown>("/sales", payload);
      return saleResponseSchema.parse(data ?? {});
    },
    onSuccess: (response, payload) => {
      pendingSale.current = null;
      setLookupPhone("");
      setCart([]);
      form.reset(defaultValues);
      if (!payload.customerPhone && response.redemption) {
        setRedemption(response.redemption);
      } else {
        toast({
          title: "Venda confirmada!",
          description: `${currencyFormatter.format(payload.amount)} registrados com sucesso.`,
        });
      }
      void queryClient.invalidateQueries({ queryKey: ["sales", tenantId] });
      void queryClient.invalidateQueries({ queryKey: ["customers", tenantId] });
    },
  });

  const busy = form.formState.isSubmitting || sale.isPending;
  const canSell = Boolean(tenantId && accessToken);
  const errors = form.formState.errors;
  const amountInput =
    useWatch({ control: form.control, name: "amount" }) ?? "0";
  const manualCents = Number(amountInput || "0");
  const cartCents = useMemo(
    () =>
      cart.reduce(
        (sum, line) =>
          sum + productPriceInCents(line.product.price) * line.quantity,
        0,
      ),
    [cart],
  );
  const totalCents = cartCents + manualCents;
  const { setFocus } = form;

  useEffect(() => {
    if (sale.isSuccess && !busy && !redemption) setFocus("amount");
  }, [sale.isSuccess, busy, redemption, setFocus]);

  async function onSubmit(values: SaleFormValues) {
    if (submissionLock.current || !tenantId || !accessToken) return;
    const totalCentsToSubmit = cartCents + Math.round(values.amount * 100);
    if (totalCentsToSubmit <= 0) {
      form.setError("amount", {
        type: "manual",
        message: "Adicione um produto ou informe um valor avulso.",
      });
      return;
    }
    submissionLock.current = true;
    try {
      const amount = totalCentsToSubmit / 100;
      const previous = pendingSale.current;
      const idempotencyKey =
        previous?.tenantId === tenantId &&
        previous.amount === amount &&
        previous.customerPhone === values.customerPhone
          ? previous.idempotencyKey
          : uuidv4();
      const payload: CreateSaleInput = {
        ...values,
        amount,
        idempotencyKey,
      };
      pendingSale.current = { ...payload, tenantId };
      await sale.mutateAsync(payload);
    } catch {
      // Keep the cart and form values so the cashier can retry safely.
    } finally {
      submissionLock.current = false;
    }
  }

  function addProduct(product: Product) {
    setCart((current) => {
      const existing = current.find((line) => line.product.id === product.id);
      return existing
        ? current.map((line) =>
            line.product.id === product.id
              ? { ...line, quantity: line.quantity + 1 }
              : line,
          )
        : [...current, { product, quantity: 1 }];
    });
    sale.reset();
  }

  function adjustQuantity(productId: string, change: number) {
    setCart((current) =>
      current.flatMap((line) => {
        if (line.product.id !== productId) return [line];
        const quantity = line.quantity + change;
        return quantity > 0 ? [{ ...line, quantity }] : [];
      }),
    );
    sale.reset();
  }

  const activeProducts =
    products.data?.filter((product) => product.isActive) ?? [];

  return (
    <>
      <Card className="w-full max-w-3xl">
        <CardHeader className="border-b border-border p-5 sm:p-6">
          <div className="mb-2 flex h-11 w-11 items-center justify-center rounded-xl bg-primary-soft text-primary-text">
            <ReceiptText size={22} aria-hidden="true" />
          </div>
          <CardTitle>Nova Venda</CardTitle>
          <CardDescription>
            PDV rápido · Selecione produtos ou informe um valor avulso.
          </CardDescription>
        </CardHeader>

        <CardContent className="p-5 sm:p-6">
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            noValidate
            aria-busy={busy}
            className="space-y-6"
          >
            <section
              aria-labelledby={`${id}-products-title`}
              className="space-y-3"
            >
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <h2
                    id={`${id}-products-title`}
                    className="text-sm font-semibold"
                  >
                    Produtos cadastrados
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Escolha itens ativos para adicionar ao carrinho.
                  </p>
                </div>
                <Input
                  aria-label="Buscar produto para venda"
                  placeholder="Buscar produto"
                  value={productSearch}
                  onChange={(event) => setProductSearch(event.target.value)}
                  disabled={busy}
                  className="sm:max-w-56"
                />
              </div>
              {products.isLoading ? (
                <div
                  className="grid gap-2 sm:grid-cols-2"
                  aria-label="Carregando produtos"
                  aria-busy="true"
                >
                  {[0, 1, 2, 3].map((item) => (
                    <Skeleton key={item} className="h-20 rounded-xl" />
                  ))}
                </div>
              ) : products.isError ? (
                <div
                  role="alert"
                  className="rounded-xl border border-destructive/30 bg-destructive-soft p-3 text-sm text-destructive"
                >
                  <p>
                    {getRequestErrorMessage(
                      products.error,
                      "Não foi possível carregar o catálogo de produtos.",
                    )}
                  </p>
                  <Button
                    type="button"
                    variant="ghost"
                    className="mt-1 h-9 px-0 text-primary-text"
                    disabled={products.isFetching}
                    onClick={() => void products.refetch()}
                  >
                    Tentar novamente
                  </Button>
                </div>
              ) : activeProducts.length ? (
                <div className="grid max-h-64 gap-2 overflow-y-auto sm:grid-cols-2">
                  {activeProducts.map((product) => {
                    const line = cart.find(
                      (item) => item.product.id === product.id,
                    );
                    return (
                      <div
                        key={product.id}
                        className="flex min-w-0 items-center justify-between gap-3 rounded-xl border border-border bg-card p-3"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">
                            {product.name}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">
                            {product.category}
                          </p>
                          <p className="mt-1 text-sm font-semibold tabular-nums">
                            {currencyFormatter.format(
                              productPriceInCents(product.price) / 100,
                            )}
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant={line ? "outline" : "default"}
                          disabled={busy}
                          className="h-9 px-3"
                          onClick={() => addProduct(product)}
                        >
                          <Plus size={15} aria-hidden="true" />{" "}
                          {line ? `Adicionar (${line.quantity})` : "Adicionar"}
                        </Button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
                  {productSearch
                    ? "Nenhum produto ativo encontrado para esta busca."
                    : "Nenhum produto ativo cadastrado. Você ainda pode registrar um valor avulso."}
                </div>
              )}
            </section>

            {cart.length > 0 && (
              <section
                aria-labelledby={`${id}-cart-title`}
                className="space-y-2 rounded-xl bg-muted/60 p-3"
              >
                <h2 id={`${id}-cart-title`} className="text-sm font-semibold">
                  Carrinho ({cart.reduce((sum, line) => sum + line.quantity, 0)}{" "}
                  itens)
                </h2>
                {cart.map((line) => (
                  <div
                    key={line.product.id}
                    className="flex items-center justify-between gap-2 text-sm"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">
                        {line.product.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {currencyFormatter.format(
                          productPriceInCents(line.product.price) / 100,
                        )}{" "}
                        cada
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label={`Remover uma unidade de ${line.product.name}`}
                        disabled={busy}
                        onClick={() => adjustQuantity(line.product.id, -1)}
                      >
                        <Minus size={15} aria-hidden="true" />
                      </Button>
                      <span className="w-6 text-center tabular-nums">
                        {line.quantity}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label={`Adicionar uma unidade de ${line.product.name}`}
                        disabled={busy}
                        onClick={() => adjustQuantity(line.product.id, 1)}
                      >
                        <Plus size={15} aria-hidden="true" />
                      </Button>
                    </div>
                    <span className="w-20 text-right font-medium tabular-nums">
                      {currencyFormatter.format(
                        (productPriceInCents(line.product.price) *
                          line.quantity) /
                          100,
                      )}
                    </span>
                  </div>
                ))}
                <div className="flex justify-between border-t border-border pt-2 text-sm font-semibold">
                  <span>Subtotal dos produtos</span>
                  <span className="tabular-nums">
                    {currencyFormatter.format(cartCents / 100)}
                  </span>
                </div>
              </section>
            )}

            <div className="space-y-2">
              <Label htmlFor={`${id}-amount`}>
                Valor avulso (R$) · opcional
              </Label>
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
                      const cents =
                        event.target.value
                          .replace(/\D/g, "")
                          .replace(/^0+(?=\d)/, "") || "0";
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
              <div className="flex items-center justify-between rounded-xl bg-primary-soft px-4 py-3">
                <span className="text-sm font-medium text-primary-text">
                  Total da venda
                </span>
                <span className="text-xl font-semibold tabular-nums text-primary-text">
                  {currencyFormatter.format(totalCents / 100)}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor={`${id}-phone`}>
                Telefone do Cliente (opcional)
              </Label>
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
                      field.onChange(
                        normalizeCustomerPhone(event.target.value),
                      );
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
                      onClick={() => void customer.refetch()}
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
                    Informe um telefone com DDD para vincular a venda ou deixe
                    em branco para gerar um QR Code de resgate.
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
                <Loader2
                  size={18}
                  className="animate-spin"
                  aria-hidden="true"
                />
              ) : (
                <Check size={18} aria-hidden="true" />
              )}
              {busy ? "Confirmando venda…" : "Confirmar Venda"}
            </Button>
          </form>
        </CardContent>
      </Card>
      <RedemptionQrDialog
        redemption={redemption}
        onOpenChange={(open) => {
          if (!open) setRedemption(null);
        }}
      />
    </>
  );
}
