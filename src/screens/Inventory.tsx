import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import { Minus, PackageOpen, Plus, Search } from "lucide-react";
import { DashboardLayout, PageHeader } from "../components/layout/DashboardLayout";
import { Badge, Button, Card, Dialog, ErrorState, Field, Input, SegmentTabs, TableSkeleton, cn, toast } from "../components/ui";
import { useMockQuery } from "../lib/useMockQuery";
import { brl, daysUntil, expiryLabel, formatDate, useInventoryStore, type Product } from "../data";
import { useScreenInit } from "../useScreenInit";

type Filter = "todos" | "vencendo" | "baixo";

export default function Inventory() {
  const init = useScreenInit();
  const router = useRouter();
  const products = useInventoryStore((s) => s.products);
  const setQty = useInventoryStore((s) => s.setQty);
  const [filter, setFilter] = useState<Filter>((router.query.filtro as Filter) || "todos");
  useEffect(() => {
    if (router.isReady && typeof router.query.filtro === "string") {
      setFilter(router.query.filtro as Filter);
    }
  }, [router.isReady, router.query.filtro]);
  const [query, setQuery] = useState(typeof init.query === "string" ? init.query : "");
  const [adjusting, setAdjusting] = useState<Product | null>(null);
  const [adding, setAdding] = useState(init.addOpen === true);
  const q = useMockQuery("inventory");

  const rows = useMemo(() => products.map((p) => ({ ...p, days: daysUntil(p.expires) })), [products]);
  const counts = {
    todos: rows.length,
    vencendo: rows.filter((p) => p.days <= 7).length,
    baixo: rows.filter((p) => p.qty < p.minQty).length,
  };
  const visible = rows
    .filter((p) => (filter === "vencendo" ? p.days <= 7 : filter === "baixo" ? p.qty < p.minQty : true))
    .filter((p) => (query ? (p.name + p.sku).toLowerCase().includes(query.toLowerCase()) : true))
    .sort((a, b) => (filter === "vencendo" ? a.days - b.days : a.name.localeCompare(b.name)));

  const tabs: { id: Filter; label: string }[] = [
    { id: "todos", label: "Todos" },
    { id: "vencendo", label: "Vencendo" },
    { id: "baixo", label: "Estoque baixo" },
  ];

  return (
    <DashboardLayout>
      <PageHeader
        title="Estoque"
        meta={q.status === "success" ? `${counts.todos} produtos` : undefined}
        action={
          <Button onClick={() => setAdding(true)}>
            <Plus size={16} strokeWidth={2} /> Adicionar produto
          </Button>
        }
      />

      <Card>
        <div className="flex flex-col gap-3 border-b border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <SegmentTabs ariaLabel="Filtrar produtos" value={filter} onChange={setFilter} options={tabs.map((t) => ({ value: t.id, label: <>{t.label}{q.isLoading || q.isError ? "" : ` (${counts[t.id]})`}</> }))} />
          <div className="relative sm:w-72">
            <Search size={16} className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-subtle-foreground" />
            <Input aria-label="Buscar produto" placeholder="Buscar por nome ou SKU" value={query} onChange={(e) => setQuery(e.target.value)} className="h-9 pl-9" />
          </div>
        </div>

        {q.isLoading ? (
          <TableSkeleton />
        ) : q.isError ? (
          <ErrorState title="Não foi possível carregar o estoque" onRetry={q.refetch} />
        ) : visible.length === 0 ? (
          <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
            <PackageOpen size={28} strokeWidth={1.5} className="text-subtle-foreground" />
            <p className="text-[15px] font-medium">{query ? `Nenhum produto encontrado para "${query}"` : "Nenhum produto neste filtro"}</p>
            <p className="text-sm text-muted-foreground">Tente outro nome ou limpe a busca</p>
            <Button variant="outline" size="sm" onClick={() => { setQuery(""); setFilter("todos"); }}>
              Limpar busca
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead>
                <tr className="border-b border-border text-left text-[13px] text-muted-foreground">
                  <th className="h-10 w-full px-6 font-medium">Produto</th>
                  <th className="h-10 px-4 font-medium">Categoria</th>
                  <th className="h-10 px-4 text-right font-medium">Quantidade</th>
                  <th className="h-10 px-4 font-medium">Validade</th>
                  <th className="h-10 px-4 text-right font-medium">Preço</th>
                  <th className="h-10 px-6"><span className="sr-only">Ações</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {visible.map((p) => {
                  const low = p.qty < p.minQty;
                  return (
                    <tr key={p.id} className="h-14 hover:bg-muted/50">
                      <td className="px-6">
                        <p className="font-medium whitespace-nowrap">{p.name}</p>
                        <p className="font-mono text-xs text-muted-foreground">{p.sku}</p>
                      </td>
                      <td className="px-4 whitespace-nowrap text-muted-foreground">{p.category}</td>
                      <td className="px-4 text-right whitespace-nowrap tabular-nums">
                        <span className={cn(low && "font-medium text-warning")}>{p.qty} {p.unit}</span>
                        {low && <span className="block text-xs text-muted-foreground">mín. {p.minQty}</span>}
                      </td>
                      <td className="px-4 whitespace-nowrap">
                        <span className="flex items-center gap-2 tabular-nums">
                          {formatDate(p.expires)}
                          {p.days <= 7 && <Badge tone={p.days <= 1 ? "warning" : "neutral"}>{expiryLabel(p.days)}</Badge>}
                        </span>
                      </td>
                      <td className="px-4 text-right whitespace-nowrap tabular-nums">{brl(p.price)}</td>
                      <td className="px-6 text-right">
                        <Button variant="ghost" size="sm" onClick={() => setAdjusting(p)}>Ajustar</Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        {q.status === "success" && (
          <div className="border-t border-border px-6 py-3 text-[13px] text-muted-foreground tabular-nums">
            {visible.length > 0 ? `1–${visible.length} de ${visible.length}` : "0 resultados"}
          </div>
        )}
      </Card>

      <AdjustDialog
        product={adjusting}
        onClose={() => setAdjusting(null)}
        onSave={(p, qty) => {
          const prev = p.qty;
          setQty(p.id, qty);
          setAdjusting(null);
          toast(`${p.name}: ${qty} ${p.unit}`, () => setQty(p.id, prev));
        }}
      />
      <AddProductDialog open={adding} onClose={() => setAdding(false)} />
    </DashboardLayout>
  );
}

function AdjustDialog({ product, onClose, onSave }: { product: Product | null; onClose: () => void; onSave: (p: Product, qty: number) => void }) {
  const [qty, setQ] = useState(0);
  const [key, setKey] = useState("");
  if (product && key !== product.id) {
    setKey(product.id);
    setQ(product.qty);
  }
  if (!product && key) setKey("");
  return (
    <Dialog
      open={!!product}
      onClose={onClose}
      title="Ajustar quantidade"
      description={product?.name}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={() => product && onSave(product, qty)}>Salvar quantidade</Button>
        </>
      }
    >
      <div className="flex items-center justify-center gap-4">
        <Button variant="outline" size="icon" aria-label="Diminuir" onClick={() => setQ((q) => Math.max(0, q - 1))}>
          <Minus size={16} />
        </Button>
        <Input
          aria-label="Quantidade"
          inputMode="numeric"
          value={qty}
          onChange={(e) => setQ(Math.max(0, Number(e.target.value.replace(/\D/g, "")) || 0))}
          className="h-12 w-28 text-center text-xl font-semibold tabular-nums"
        />
        <Button variant="outline" size="icon" aria-label="Aumentar" onClick={() => setQ((q) => q + 1)}>
          <Plus size={16} />
        </Button>
      </div>
      <p className="mt-3 text-center text-[13px] text-muted-foreground">Em {product?.unit}, mínimo {product?.minQty}</p>
    </Dialog>
  );
}

function AddProductDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const add = useInventoryStore((s) => s.add);
  const empty = { name: "", qty: "", expires: "", price: "" };
  const [f, setF] = useState(empty);
  const [errors, setErrors] = useState<Partial<Record<keyof typeof empty, string>>>({});

  const submit = () => {
    const e: typeof errors = {};
    if (!f.name.trim()) e.name = "Informe o nome do produto";
    if (!/^\d+$/.test(f.qty)) e.qty = "Use um número inteiro";
    if (!/^\d{2}\/\d{2}\/\d{4}$/.test(f.expires)) e.expires = "Use o formato DD/MM/AAAA";
    if (!/^\d+([.,]\d{1,2})?$/.test(f.price)) e.price = "Use o formato 12,90";
    setErrors(e);
    if (Object.keys(e).length) {
      document.getElementById("np-" + Object.keys(e)[0])?.focus();
      return;
    }
    const [d, m, y] = f.expires.split("/");
    add({ name: f.name.trim(), sku: "NOV-" + String(Date.now()).slice(-3), category: "Padaria", qty: Number(f.qty), unit: "un", minQty: 0, expires: `${y}-${m}-${d}`, price: Number(f.price.replace(",", ".")) });
    toast("Produto adicionado");
    setF(empty);
    setErrors({});
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} title="Adicionar produto" description="Cadastre um item no estoque." footer={<><Button variant="outline" onClick={onClose}>Cancelar</Button><Button onClick={submit}>Adicionar produto</Button></>}>
      <div className="flex flex-col gap-4">
        <Field id="np-name" label="Nome" error={errors.name}><Input id="np-name" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} invalid={!!errors.name} /></Field>
        <Field id="np-qty" label="Quantidade" error={errors.qty}><Input id="np-qty" inputMode="numeric" value={f.qty} onChange={(e) => setF({ ...f, qty: e.target.value })} invalid={!!errors.qty} /></Field>
        <Field id="np-expires" label="Validade" hint="DD/MM/AAAA" error={errors.expires}><Input id="np-expires" placeholder="DD/MM/AAAA" value={f.expires} onChange={(e) => setF({ ...f, expires: e.target.value })} invalid={!!errors.expires} /></Field>
        <Field id="np-price" label="Preço" error={errors.price}><Input id="np-price" inputMode="decimal" placeholder="12,90" value={f.price} onChange={(e) => setF({ ...f, price: e.target.value })} invalid={!!errors.price} /></Field>
      </div>
    </Dialog>
  );
}
