import { z } from "zod";

export const productSchema = z.object({
  id: z.string().min(1), name: z.string(),
  price: z.union([z.number(), z.string()]).transform(Number),
  category: z.string(), costPrice: z.union([z.number(), z.string(), z.null()]).optional().transform((v) => v == null ? null : Number(v)),
  quantity: z.number().default(0), minQuantity: z.number().default(0),
  expiresAt: z.string().nullable().optional(), trackStock: z.boolean().default(true), isActive: z.boolean(),
});
export const productListSchema = z.array(productSchema);
export const productFormSchema = z.object({
  name: z.string().trim().min(1, "Informe o nome do produto.").max(120),
  price: z.string().regex(/^\d+$/, "Informe o preço em números.").refine((v) => Number(v) > 0, "O preço deve ser maior que zero."),
  costPrice: z.string(), quantity: z.string(), minQuantity: z.string(), expiresAt: z.string(), trackStock: z.boolean(),
  category: z.string().trim().min(1, "Informe a categoria.").max(80),
});
export type Product = z.infer<typeof productSchema>;
export type ProductFormInput = z.input<typeof productFormSchema>;
export type ProductFormValues = z.output<typeof productFormSchema>;
export function formatProductPriceFromCents(cents: string): string {
  const digits = cents.replace(/\D/g, ""); if (!digits) return "";
  const normalized = digits.padStart(3, "0");
  return `${normalized.slice(0, -2).replace(/\B(?=(\d{3})+(?!\d))/g, ".")},${normalized.slice(-2)}`;
}
export function productPriceFromCents(cents: string): number { return Number(cents || 0) / 100; }
export function productPriceInCents(price: string | number): number {
  const [whole, fraction = ""] = String(price).split(".");
  return Number(whole) * 100 + Number(fraction.padEnd(2, "0").slice(0, 2));
}
