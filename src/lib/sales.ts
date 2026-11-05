import { z } from "zod";

export const customerPhoneSchema = z
  .string()
  .regex(
    /^[1-9]{2}\d{8,9}$/,
    "Informe um telefone com DDD e 10 ou 11 dígitos.",
  );

export const saleFormSchema = z.object({
  // Keep cents as digits while editing to avoid locale parsing and rounding errors.
  amount: z
    .string()
    .regex(/^\d{1,15}$/, "Informe um valor válido.")
    .refine(
      (value) => Number(value) > 0,
      "O valor da venda deve ser de pelo menos R$ 0,01.",
    )
    .transform((value) => Number(value) / 100),
  customerPhone: customerPhoneSchema,
});

export type SaleFormInput = z.input<typeof saleFormSchema>;
export type SaleFormValues = z.output<typeof saleFormSchema>;
export type CreateSaleInput = SaleFormValues & { idempotencyKey: string };

export const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

export function formatSaleAmount(cents: string): string {
  return cents ? currencyFormatter.format(Number(cents) / 100) : "";
}

export function normalizeCustomerPhone(value: string): string {
  const digits = value.replace(/\D/g, "");
  const national = /^55\d{10,11}$/.test(digits) ? digits.slice(2) : digits;
  return national.slice(0, 11);
}

export function formatCustomerPhone(digits: string): string {
  if (!digits) return "";
  if (digits.length <= 2) return `(${digits}`;
  const number = digits.slice(2);
  const split = digits.length > 10 ? 5 : 4;
  return `(${digits.slice(0, 2)}) ${number.slice(0, split)}${number.length > split ? `-${number.slice(split)}` : ""}`;
}
