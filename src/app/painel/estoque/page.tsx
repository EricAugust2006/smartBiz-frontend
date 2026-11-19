import type { Metadata } from "next";
import { ProductsManager } from "@/components/products/products-manager";

export const metadata: Metadata = { title: "Estoque e Produtos | SmartBiz AI" };

export default function StockPage() {
  return <ProductsManager />;
}
