import type { Metadata } from "next";
import { NovaVenda } from "@/components/sales/nova-venda";

export const metadata: Metadata = { title: "Nova Venda | SmartBiz AI" };

export default function NovaVendaPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header>
        <p className="mb-1 text-sm text-muted-foreground">Balcão da loja</p>
        <h1 className="text-2xl font-semibold tracking-tight">PDV Rápido</h1>
      </header>
      <NovaVenda />
    </div>
  );
}
