import { expect, test } from "playwright/test";

const tenant = {
  id: "e2e-tenant",
  name: "Loja de teste",
  slug: "teste",
  plan: "test",
  whatsappNumber: null,
};

for (const viewport of [
  { name: "desktop", width: 1440, height: 960 },
  { name: "tablet", width: 820, height: 1180 },
  { name: "mobile", width: 390, height: 844 },
]) {
  test(`PDV em ${viewport.name}: novo cliente, venda e navegação`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    await page.addInitScript(
      (session) => {
        window.localStorage.setItem(
          "smartbiz.session",
          JSON.stringify(session),
        );
      },
      {
        accessToken: "e2e-token",
        user: {
          id: "e2e-user",
          name: "Caixa",
          email: "test@example.com",
          role: "OWNER",
        },
        tenant,
      },
    );
    await page.route("**/tenants/me", (route) =>
      route.fulfill({ json: tenant }),
    );
    await page.route("**/customers/by-phone?**", (route) =>
      route.fulfill({
        status: 404,
        json: { message: "Cliente não encontrado" },
      }),
    );
    let payload: unknown;
    await page.route("**/sales", async (route) => {
      payload = route.request().postDataJSON();
      await route.fulfill({ status: 201, json: { id: "test-sale" } });
    });

    const pageErrors: string[] = [];
    page.on("pageerror", (error) => pageErrors.push(error.message));
    await page.goto("/painel/nova-venda");
    await expect(
      page.getByRole("heading", { name: "PDV Rápido" }),
    ).toBeVisible();

    if (viewport.width < 1024) {
      const trigger = page.getByRole("button", { name: "Abrir menu" });
      await trigger.click();
      await expect(page.getByRole("dialog")).toBeVisible();
      await expect(
        page.getByRole("dialog").getByRole("link", { name: "Nova Venda" }),
      ).toHaveAttribute("aria-current", "page");
      await page.keyboard.press("Escape");
      await expect(page.getByRole("dialog")).toBeHidden();
      await expect(trigger).toBeFocused();
    } else {
      await expect(
        page
          .getByRole("complementary")
          .getByRole("link", { name: "Nova Venda" }),
      ).toBeVisible();
    }

    await page.getByLabel("Valor da Venda (R$)").fill("1050");
    await page.getByLabel("Telefone do Cliente").fill("11987654321");
    await page.getByLabel("Telefone do Cliente").press("Tab");
    await expect(page.getByText("Novo Cliente", { exact: true })).toBeVisible();
    await page.screenshot({
      path: `test-results/pdv-${viewport.name}.png`,
      fullPage: true,
    });
    await expect(
      page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).resolves.toBe(true);
    await page.getByRole("button", { name: "Confirmar Venda" }).click();
    await expect(
      page.getByText("Venda confirmada!", { exact: true }),
    ).toBeVisible();
    expect(payload).toEqual({
      amount: 10.5,
      customerPhone: "11987654321",
      idempotencyKey: expect.stringMatching(
        /^[\da-f]{8}-[\da-f]{4}-4[\da-f]{3}-[89ab][\da-f]{3}-[\da-f]{12}$/i,
      ),
    });
    await expect(page.getByLabel("Valor da Venda (R$)")).toHaveValue("");
    await expect(page.getByLabel("Telefone do Cliente")).toHaveValue("");
    await expect(page.getByLabel("Valor da Venda (R$)")).toBeFocused();
    expect(pageErrors).toEqual([]);
  });
}
