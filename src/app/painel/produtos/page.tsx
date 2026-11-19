import { redirect } from "next/navigation";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Produtos | SmartBiz AI" };

export default function ProductsPage() {
  redirect("/painel/estoque");
}
