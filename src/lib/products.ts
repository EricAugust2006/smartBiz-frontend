import { z } from "zod";

export const productSchema = z.object({
  id: z.string().min(1),
  name: z.string(),
  price: z.string().regex(/^\d+(?:\.\d{1,2})?$/),
  category: z.string(),
  isActive: z.boolean(),
});

export const productListSchema = z.array(productSchema);

export const productFormSchema = z.object({
  name: z.string().trim().min(1, "Informe o nome do produto.").max(120),
  price: z
    .string()
    .trim()
    .regex(/^\d+(?:[.,]\d{1,2})?$/, "Informe um preço válido, como 19,90.")
    .refine(
      (value) => Number(value.replace(",", ".")) > 0,
      "O preço deve ser maior que zero.",
    ),
  category: z.string().trim().min(1, "Informe a categoria.").max(80),
});

export type Product = z.infer<typeof productSchema>;
export type ProductFormInput = z.input<typeof productFormSchema>;
export type ProductFormValues = z.output<typeof productFormSchema>;

export function normalizeProductPrice(price: string): string {
  const [whole, fraction = ""] = price.trim().replace(",", ".").split(".");
  return `${whole}.${fraction.padEnd(2, "0")}`;
}

export function productPriceInCents(price: string): number {
  const [whole, fraction = ""] = price.split(".");
  return Number(whole) * 100 + Number(fraction.padEnd(2, "0").slice(0, 2));
}
