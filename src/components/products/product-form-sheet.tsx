"use client";

import { useId, useRef } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, PackagePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from "@/components/ui/sheet";
import { useToast } from "@/components/ui/toaster";
import { useCreateProduct, useUpdateProduct } from "@/hooks/use-products";
import { getRequestErrorMessage } from "@/lib/axios";
import { currencyFormatter } from "@/lib/sales";
import {
  formatProductPriceFromCents,
  productFormSchema,
  productPriceInCents,
  type Product,
  type ProductFormInput,
  type ProductFormValues,
} from "@/lib/products";

const emptyValues: ProductFormInput = {
  name: "",
  price: "",
  costPrice: "",
  quantity: "0",
  minQuantity: "0",
  expiresAt: "",
  trackStock: true,
  category: "",
};

function FieldError({ id, message }: { id: string; message?: string }) {
  return message ? (
    <p id={id} role="alert" className="text-sm text-destructive">
      {message}
    </p>
  ) : null;
}

export function ProductFormSheet({
  open,
  product,
  onOpenChange,
}: {
  open: boolean;
  product: Product | null;
  onOpenChange: (open: boolean) => void;
}) {
  const id = useId();
  const create = useCreateProduct();
  const update = useUpdateProduct();
  const { toast } = useToast();
  const lock = useRef(false);
  const form = useForm<ProductFormInput, unknown, ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: product
      ? {
          name: product.name,
          price: String(productPriceInCents(product.price)),
          costPrice: String(productPriceInCents(product.costPrice ?? 0)),
          quantity: String(product.quantity),
          minQuantity: String(product.minQuantity),
          expiresAt: product.expiresAt?.slice(0, 10) ?? "",
          trackStock: product.trackStock,
          category: product.category,
        }
      : emptyValues,
    mode: "onTouched",
  });
  const busy =
    create.isPending || update.isPending || form.formState.isSubmitting;
  const errors = form.formState.errors;
  const saleCents = Number(form.watch("price") || 0);
  const costCents = Number(form.watch("costPrice") || 0);
  const hasCost = costCents > 0;
  const belowCost = hasCost && saleCents < costCents;
  const margin =
    saleCents > 0 ? ((saleCents - costCents) / saleCents) * 100 : 0;

  function handleOpenChange(next: boolean) {
    if (busy) return;
    if (!next) {
      form.reset(emptyValues);
      create.reset();
      update.reset();
    }
    onOpenChange(next);
  }

  async function onSubmit(values: ProductFormValues) {
    if (lock.current) return;
    lock.current = true;
    try {
      if (product) {
        await update.mutateAsync({
          id: product.id,
          values: { ...values, isActive: product.isActive },
        });
      } else {
        await create.mutateAsync(values);
      }
      toast({
        title: product ? "Produto atualizado!" : "Produto cadastrado!",
        description: `${values.name} já está no catálogo da loja.`,
      });
      form.reset(emptyValues);
      onOpenChange(false);
    } catch {
      // Keep the form open with values preserved for retry.
    } finally {
      lock.current = false;
    }
  }

  const failure = create.isError
    ? create.error
    : update.isError
      ? update.error
      : null;
  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent
        side="right"
        closeLabel="Fechar formulário"
        closeDisabled={busy}
        className="flex flex-col overflow-y-auto p-0"
      >
        <header className="border-b border-border px-6 pb-6 pt-8 pr-14">
          <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-primary-soft text-primary-text">
            <PackagePlus size={22} aria-hidden="true" />
          </div>
          <SheetTitle className="text-xl font-semibold tracking-tight">
            {product ? "Editar produto" : "Novo produto"}
          </SheetTitle>
          <SheetDescription className="mt-2 text-sm text-muted-foreground">
            Informe os dados que serão exibidos no catálogo e no PDV.
          </SheetDescription>
        </header>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          noValidate
          aria-busy={busy}
          className="flex flex-1 flex-col"
        >
          <fieldset disabled={busy} className="space-y-5 p-6">
            <div className="flex items-center justify-between">
              <Label htmlFor={`${id}-track`}>Controlar estoque</Label>
              <Controller
                control={form.control}
                name="trackStock"
                render={({ field }) => (
                  <Switch
                    id={`${id}-track`}
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                )}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`${id}-name`}>Nome do produto</Label>
              <Input
                id={`${id}-name`}
                placeholder="Ex.: Café expresso"
                autoComplete="off"
                {...form.register("name")}
                aria-invalid={Boolean(errors.name)}
                aria-describedby={errors.name ? `${id}-name-error` : undefined}
              />
              <FieldError
                id={`${id}-name-error`}
                message={errors.name?.message}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`${id}-cost`}>Preço de custo (opcional)</Label>
              <p className="text-xs text-muted-foreground">
                Quanto você paga por unidade; usado para calcular margem e lucro
              </p>
              <Input
                id={`${id}-cost`}
                inputMode="numeric"
                value={formatProductPriceFromCents(form.watch("costPrice"))}
                onChange={(e) =>
                  form.setValue("costPrice", e.target.value.replace(/\D/g, ""))
                }
                placeholder="0,00"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor={`${id}-quantity`}>Saldo atual</Label>
                <Input
                  id={`${id}-quantity`}
                  type="number"
                  min="0"
                  {...form.register("quantity")}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`${id}-minimum`}>Estoque mínimo</Label>
                <Input
                  id={`${id}-minimum`}
                  type="number"
                  min="0"
                  {...form.register("minQuantity")}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor={`${id}-expires`}>Validade (opcional)</Label>
              <Input
                id={`${id}-expires`}
                type="date"
                {...form.register("expiresAt")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`${id}-price`}>Preço de venda</Label>
              <p className="text-xs text-muted-foreground">
                Valor cobrado do cliente no PDV
              </p>
              <Controller
                control={form.control}
                name="price"
                render={({ field }) => (
                  <Input
                    id={`${id}-price`}
                    name={field.name}
                    ref={field.ref}
                    value={formatProductPriceFromCents(field.value)}
                    placeholder="19,90"
                    inputMode="numeric"
                    autoComplete="off"
                    onBlur={field.onBlur}
                    onChange={(event) =>
                      field.onChange(event.target.value.replace(/\D/g, ""))
                    }
                    aria-invalid={Boolean(errors.price)}
                    aria-describedby={
                      errors.price ? `${id}-price-error` : undefined
                    }
                  />
                )}
              />
              <FieldError
                id={`${id}-price-error`}
                message={errors.price?.message}
              />
            </div>
            {hasCost && (
              <p
                className={`rounded-xl p-3 text-sm ${belowCost ? "bg-warning-soft text-warning" : "bg-success-soft text-success"}`}
                aria-live="polite"
              >
                {belowCost
                  ? "Atenção: preço de venda abaixo do custo"
                  : `Lucro por unidade: ${currencyFormatter.format((saleCents - costCents) / 100)} (${margin.toFixed(1).replace(".", ",")}% de margem)`}
              </p>
            )}
            <div className="space-y-2">
              <Label htmlFor={`${id}-category`}>Categoria</Label>
              <Input
                id={`${id}-category`}
                placeholder="Ex.: Bebidas"
                autoComplete="off"
                {...form.register("category")}
                aria-invalid={Boolean(errors.category)}
                aria-describedby={
                  errors.category ? `${id}-category-error` : undefined
                }
              />
              <FieldError
                id={`${id}-category-error`}
                message={errors.category?.message}
              />
            </div>
          </fieldset>
          {failure && (
            <p
              role="alert"
              className="mx-6 mb-6 rounded-xl border border-destructive/30 bg-destructive-soft p-3 text-sm text-destructive"
            >
              {getRequestErrorMessage(
                failure,
                `Não foi possível ${product ? "atualizar" : "cadastrar"} o produto. Confira sua conexão e tente novamente; os dados foram mantidos.`,
              )}
            </p>
          )}
          <footer className="mt-auto flex flex-wrap justify-end gap-3 border-t border-border p-6">
            <Button
              type="button"
              variant="outline"
              disabled={busy}
              onClick={() => handleOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={busy}
              className="bg-primary text-primary-foreground"
            >
              {busy && (
                <Loader2
                  size={16}
                  className="animate-spin"
                  aria-hidden="true"
                />
              )}
              {busy
                ? "Salvando…"
                : product
                  ? "Salvar alterações"
                  : "Cadastrar produto"}
            </Button>
          </footer>
        </form>
      </SheetContent>
    </Sheet>
  );
}
