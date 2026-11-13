"use client";

import { useMemo, useState } from "react";
import { PackageOpen, Pencil, Plus, RefreshCw, Search } from "lucide-react";
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
  pending,
}: {
  product: Product;
  onEdit: (product: Product) => void;
  onToggle: (product: Product) => void;
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
        <p className="mt-5 text-2xl font-semibold tabular-nums">
          {currencyFormatter.format(productPriceInCents(product.price) / 100)}
        </p>
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
          price: product.price,
          category: product.category,
          isActive: !product.isActive,
        },
      });
    } catch {
      // The mutation error is rendered below; product data stays unchanged.
    }
  }

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
          {products.data?.length ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {products.data.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onEdit={(item) => {
                    setEditing(item);
                    setFormOpen(true);
                  }}
                  onToggle={toggleProduct}
                  pending={update.isPending}
                />
              ))}
            </div>
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
    </div>
  );
}
