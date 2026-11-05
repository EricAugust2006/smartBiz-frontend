import { describe, expect, it } from "vitest";
import {
  formatCustomerPhone,
  formatSaleAmount,
  normalizeCustomerPhone,
  saleFormSchema,
} from "@/lib/sales";

describe("validação e máscaras do PDV", () => {
  it("converte centavos digitados em reais no contrato da API", () => {
    expect(
      saleFormSchema.parse({ amount: "1050", customerPhone: "11987654321" }),
    ).toEqual({ amount: 10.5, customerPhone: "11987654321" });
    expect(
      saleFormSchema.parse({ amount: "1", customerPhone: "1134567890" }).amount,
    ).toBe(0.01);
    expect(formatSaleAmount("123456").replace(/\s/g, " ")).toBe("R$ 1.234,56");
  });

  it.each(["", "0", "-100", "10.50", "Infinity", "9999999999999999"])(
    "rejeita valor inválido: %s",
    (amount) => {
      expect(
        saleFormSchema.safeParse({ amount, customerPhone: "11987654321" })
          .success,
      ).toBe(false);
    },
  );

  it("formata telefones fixos e celulares e aceita colar o prefixo +55", () => {
    expect(formatCustomerPhone("1134567890")).toBe("(11) 3456-7890");
    expect(formatCustomerPhone("11987654321")).toBe("(11) 98765-4321");
    expect(normalizeCustomerPhone("+55 (11) 98765-4321")).toBe("11987654321");
    expect(normalizeCustomerPhone("(55) 98765-4321")).toBe("55987654321");
  });

  it.each(["", "119999", "00123456789", "119876543210"])(
    "rejeita telefone inválido: %s",
    (customerPhone) => {
      expect(
        saleFormSchema.safeParse({ amount: "100", customerPhone }).success,
      ).toBe(false);
    },
  );
});
