"use client";

import { useMemo, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { PackageOpen, Pencil, Plus, RefreshCw, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { ProductFormSheet } from "@/components/products/product-form-sheet";
import { useProducts, useUpdateProduct } from "@/hooks/use-products";
import { getRequestErrorMessage } from "@/lib/axios";
import { currencyFormatter } from "@/lib/sales";
import { productPriceInCents, type Product } from "@/lib/products";
import { useToast } from "@/components/ui/toaster";

function ProductListSkeleton() {
  return (
    <div
      className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
      aria-label="Carregando produtos"
      aria-busy="true"
    >
      {Array.from({ length: 6 }, (_, index) => (
        <Card key={index} aria-hidden="true">
          <CardContent className="space-y-4 p-5">
            <Skeleton className="h-5 w-2/3" />
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-8 w-1/2" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      ))}
      <span className="sr-only">Carregando produtos…</span>
    </div>
  );
}

function ProductCard({
  product,
  onEdit,
  onToggle,
  onAdjust,
  pending,
}: {
  product: Product;
  onEdit: (product: Product) => void;
  onToggle: (product: Product) => void;
  onAdjust: (product: Product) => void;
  pending: boolean;
}) {
  return (
    <Card className="min-w-0">
      <CardContent className="flex h-full flex-col p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="truncate font-semibold">{product.name}</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {product.category}
            </p>
          </div>
          <span
            className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${product.isActive ? "bg-success-soft text-success" : "bg-muted text-muted-foreground"}`}
          >
            {product.isActive ? "Ativo" : "Inativo"}
          </span>
        </div>
        <div className="mt-4">
          <p className="text-xl font-semibold tabular-nums">
            {currencyFormatter.format(productPriceInCents(product.price) / 100)}
          </p>
          <p className="text-xs text-muted-foreground">
            {product.costPrice != null && product.costPrice > 0
              ? `Custo: ${currencyFormatter.format(product.costPrice)}`
              : null}
          </p>
        </div>
        <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-sm">
          <div>
            {product.costPrice != null && product.costPrice > 0 && (
              <div>
                <dt className="text-muted-foreground">Custo</dt>
                <dd>{currencyFormatter.format(product.costPrice)}</dd>
              </div>
            )}
          </div>
          <div>
            <dt className="text-muted-foreground">Estoque</dt>
            <dd className="font-semibold">
              {product.trackStock
                ? `${product.quantity} un.`
                : "Não controlado"}
            </dd>
            {product.trackStock && (
              <dd className="text-xs text-muted-foreground">
                Mínimo: {product.minQuantity}
              </dd>
            )}
            {product.trackStock && product.quantity <= product.minQuantity && (
              <span className="mt-1 inline-flex rounded-full bg-destructive-soft px-2 py-0.5 text-xs font-medium text-destructive">
                Estoque baixo
              </span>
            )}
          </div>
          <div>
            <dt className="text-muted-foreground">Estoque mínimo</dt>
            <dd>{product.trackStock ? product.minQuantity : "—"}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Validade</dt>
            <dd>{product.expiresAt?.slice(0, 10) ?? "Sem validade"}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Status</dt>
            <dd>{product.isActive ? "Ativo" : "Inativo"}</dd>
          </div>
        </dl>
        <div className="mt-auto flex flex-wrap gap-2 pt-5">
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={() => onEdit(product)}
          >
            <Pencil size={16} aria-hidden="true" /> Editar
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => onAdjust(product)}
          >
            Repor / Ajustar
          </Button>
          <Button
            type="button"
            variant="ghost"
            disabled={pending}
            onClick={() => onToggle(product)}
          >
            {pending ? "Salvando…" : product.isActive ? "Desativar" : "Ativar"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export function ProductsManager() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [editing, setEditing] = useState<Product | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [filter, setFilter] = useState("all");
  const [adjusting, setAdjusting] = useState<Product | null>(null);
  const [adjustMode, setAdjustMode] = useState<"add" | "set">("add");
  const [adjustAmount, setAdjustAmount] = useState("1");
  const { toast } = useToast();
  const allProducts = useProducts();
  const products = useProducts(search, category === "all" ? "" : category);
  const update = useUpdateProduct();
  const categories = useMemo(
    () =>
      [
        ...new Set(
          (allProducts.data ?? [])
            .map((product) => product.category)
            .filter(Boolean),
        ),
      ].sort((a, b) => a.localeCompare(b, "pt-BR")),
    [allProducts.data],
  );

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }

  async function toggleProduct(product: Product) {
    try {
      await update.mutateAsync({
        id: product.id,
        values: {
          name: product.name,
          price: String(productPriceInCents(product.price)),
          category: product.category,
          isActive: !product.isActive,
        },
      });
    } catch {
      // The mutation error is rendered below; product data stays unchanged.
    }
  }

  function openAdjust(product: Product) {
    setAdjusting(product);
    setAdjustMode("add");
    setAdjustAmount("1");
  }

  async function saveStock() {
    if (!adjusting || !/^\d+(?:\.\d+)?$/.test(adjustAmount)) return;
    const amount = Number(adjustAmount);
    const quantity =
      adjustMode === "add" ? adjusting.quantity + amount : amount;
    try {
      await update.mutateAsync({
        id: adjusting.id,
        values: { quantity: String(quantity) },
      });
      toast({
        title: "Estoque atualizado",
        description: `${adjusting.name}: ${quantity} un.`,
      });
      setAdjusting(null);
    } catch {
      /* error is shown below */
    }
  }

  const visibleProducts = (products.data ?? []).filter(
    (p) =>
      filter === "all" ||
      (filter === "low" && p.trackStock && p.quantity <= p.minQuantity) ||
      (filter === "expiry" &&
        p.expiresAt &&
        Math.ceil(
          (new Date(`${p.expiresAt.slice(0, 10)}T00:00:00`).getTime() -
            new Date(new Date().toDateString()).getTime()) /
            86400000,
        ) <= 7),
  );

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="mb-1 text-sm text-muted-foreground">Catálogo da loja</p>
          <h1 className="text-2xl font-semibold tracking-tight">Produtos</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Cadastre e mantenha os itens disponíveis para venda no PDV.
          </p>
        </div>
        <Button
          size="lg"
          onClick={openCreate}
          className="bg-primary text-primary-foreground"
        >
          <Plus size={18} aria-hidden="true" /> Novo produto
        </Button>
      </header>

      <Card>
        <CardContent className="grid gap-4 p-4 sm:grid-cols-[minmax(0,1fr)_minmax(12rem,0.45fr)] sm:p-5">
          <div className="space-y-2">
            <Label htmlFor="products-search">Buscar por nome</Label>
            <div className="relative">
              <Search
                size={17}
                aria-hidden="true"
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <Input
                id="products-search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Ex.: Café expresso"
                className="pl-10"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="products-category">Categoria</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger id="products-category">
                <SelectValue placeholder="Todas as categorias" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as categorias</SelectItem>
                {categories.map((item) => (
                  <SelectItem key={item} value={item}>
                    {item}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-2" aria-label="Filtros de estoque">
        {[
          ["all", "Todos"],
          ["low", "Estoque baixo"],
          ["expiry", "Vencidos / vencendo"],
        ].map(([value, label]) => (
          <Button
            key={value}
            variant={filter === value ? "default" : "outline"}
            onClick={() => setFilter(value)}
          >
            {label}
          </Button>
        ))}
      </div>

      {products.isLoading ? (
        <ProductListSkeleton />
      ) : (
        <>
          {products.isError && (
            <Card role="alert" className="p-5">
              <p className="text-sm text-destructive">
                {getRequestErrorMessage(
                  products.error,
                  products.data
                    ? "Não foi possível atualizar os produtos. Os últimos dados carregados foram mantidos."
                    : "Não foi possível carregar os produtos. Confira sua conexão e tente novamente.",
                )}
              </p>
              <Button
                variant="outline"
                disabled={products.isFetching}
                onClick={() => void products.refetch()}
                className="mt-3"
              >
                <RefreshCw
                  size={16}
                  className={products.isFetching ? "animate-spin" : undefined}
                  aria-hidden="true"
                />{" "}
                Tentar novamente
              </Button>
            </Card>
          )}
          {update.isError && (
            <p
              role="alert"
              className="rounded-xl border border-destructive/30 bg-destructive-soft p-3 text-sm text-destructive"
            >
              {getRequestErrorMessage(
                update.error,
                "Não foi possível atualizar este produto. Tente novamente.",
              )}
            </p>
          )}
          {visibleProducts.length ? (
            <>
              <div className="hidden overflow-x-auto rounded-xl border border-border lg:block">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left">
                      <th className="p-3">Produto</th>
                      <th className="p-3">Preço</th>
                      <th className="p-3">Estoque</th>
                      <th className="p-3">Validade</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleProducts.map((p) => (
                      <tr key={p.id} className="border-b">
                        <td className="p-3">
                          {p.name}
                          <div className="text-muted-foreground">
                            {p.category}
                          </div>
                        </td>
                        <td className="p-3">
                          <strong>{currencyFormatter.format(p.price)}</strong>
                          {p.costPrice != null && p.costPrice > 0 && (
                            <div className="text-xs text-muted-foreground">
                              Custo: {currencyFormatter.format(p.costPrice)}
                            </div>
                          )}
                        </td>
                        <td className="p-3">
                          {p.trackStock ? (
                            <>
                              <strong>{p.quantity} un.</strong>
                              <div className="text-xs text-muted-foreground">
                                Mínimo: {p.minQuantity}
                              </div>
                              {p.quantity <= p.minQuantity && (
                                <span className="text-xs font-medium text-destructive">
                                  Estoque baixo
                                </span>
                              )}
                            </>
                          ) : (
                            "Não controlado"
                          )}
                        </td>
                        <td className="p-3">
                          {p.expiresAt?.slice(0, 10) ?? "—"}
                        </td>
                        <td className="p-3">
                          {p.isActive ? "Ativo" : "Inativo"}
                        </td>
                        <td className="p-3">
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              onClick={() => openAdjust(p)}
                            >
                              Repor
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => {
                                setEditing(p);
                                setFormOpen(true);
                              }}
                            >
                              Editar
                            </Button>
                            <Button
                              variant="ghost"
                              disabled={update.isPending}
                              onClick={() => void toggleProduct(p)}
                            >
                              {p.isActive ? "Inativar" : "Ativar"}
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:hidden">
                {visibleProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onEdit={(item) => {
                      setEditing(item);
                      setFormOpen(true);
                    }}
                    onToggle={toggleProduct}
                    onAdjust={openAdjust}
                    pending={update.isPending}
                  />
                ))}
              </div>
            </>
          ) : !products.isError ? (
            <Card className="flex flex-col items-center gap-4 px-6 py-14 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-soft text-primary-text">
                <PackageOpen size={26} aria-hidden="true" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">
                  {search || category !== "all"
                    ? "Nenhum produto encontrado"
                    : "Seu catálogo começa aqui"}
                </h2>
                <p className="mt-2 max-w-md text-sm text-muted-foreground">
                  {search || category !== "all"
                    ? "Tente mudar a busca ou o filtro de categoria."
                    : "Cadastre seus produtos para usá-los também no registro de vendas."}
                </p>
              </div>
              {search || category !== "all" ? (
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearch("");
                    setCategory("all");
                  }}
                >
                  Limpar filtros
                </Button>
              ) : (
                <Button variant="outline" onClick={openCreate}>
                  Cadastrar primeiro produto
                </Button>
              )}
            </Card>
          ) : null}
        </>
      )}
      <ProductFormSheet
        key={editing?.id ?? "new-product"}
        open={formOpen}
        product={editing}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setEditing(null);
        }}
      />
      <Dialog.Root
        open={Boolean(adjusting)}
        onOpenChange={(open) => !open && setAdjusting(null)}
      >
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-40 bg-overlay data-[state=open]:animate-fade-in" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[calc(100vw-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-border bg-card p-6 text-foreground shadow-overlay outline-none">
            <Dialog.Close asChild>
              <button
                className="absolute right-4 top-4 rounded-lg p-2 text-muted-foreground hover:bg-muted"
                aria-label="Fechar"
              >
                <X size={18} />
              </button>
            </Dialog.Close>
            <Dialog.Title className="text-xl font-semibold">
              Repor / Ajustar saldo
            </Dialog.Title>
            <Dialog.Description className="mt-1 text-sm text-muted-foreground">
              {adjusting?.name} · saldo atual: {adjusting?.quantity ?? 0}
            </Dialog.Description>
            <div className="mt-5 grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant={adjustMode === "add" ? "default" : "outline"}
                onClick={() => setAdjustMode("add")}
              >
                Adicionar entrada (+)
              </Button>
              <Button
                type="button"
                variant={adjustMode === "set" ? "default" : "outline"}
                onClick={() => setAdjustMode("set")}
              >
                Definir saldo exato (=)
              </Button>
            </div>
            <Label htmlFor="stock-adjust-amount" className="mt-5 block">
              {adjustMode === "add" ? "Quantidade a adicionar" : "Novo saldo"}
            </Label>
            <Input
              id="stock-adjust-amount"
              type="number"
              min="0"
              step="1"
              value={adjustAmount}
              onChange={(event) => setAdjustAmount(event.target.value)}
              className="mt-2"
            />
            <div className="mt-3 flex flex-wrap gap-2">
              {[1, 5, 10, 50].map((n) => (
                <Button
                  key={n}
                  type="button"
                  variant="outline"
                  onClick={() =>
                    setAdjustAmount(String(Number(adjustAmount || 0) + n))
                  }
                >
                  +{n}
                </Button>
              ))}
            </div>
            <p className="mt-4 rounded-xl bg-muted p-3 text-sm">
              Novo saldo:{" "}
              <strong>
                {(adjusting?.quantity ?? 0) +
                  (adjustMode === "add"
                    ? Number(adjustAmount || 0)
                    : Number(adjustAmount || 0) -
                      (adjusting?.quantity ?? 0))}{" "}
                un.
              </strong>
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <Dialog.Close asChild>
                <Button variant="outline">Cancelar</Button>
              </Dialog.Close>
              <Button
                onClick={() => void saveStock()}
                disabled={
                  update.isPending || !/^\d+(?:\.\d+)?$/.test(adjustAmount)
                }
                className="bg-primary text-primary-foreground"
              >
                {update.isPending ? "Salvando…" : "Salvar saldo"}
              </Button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
