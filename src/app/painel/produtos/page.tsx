import type { Metadata } from "next";
import { ProductsManager } from "@/components/products/products-manager";

export const metadata: Metadata = { title: "Produtos | SmartBiz AI" };

export default function ProductsPage() {
  return <ProductsManager />;
}
