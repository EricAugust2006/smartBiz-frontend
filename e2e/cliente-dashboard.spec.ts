import { expect, test } from "playwright/test";
import { b2cDashboardResponse } from "../tests/fixtures/b2c-dashboard";

const tokenKey = "@smartbiz:b2c_token";
const ownerSession = JSON.stringify({
  accessToken: "owner-token",
  user: { id: "owner", name: "Lojista" },
  tenant: { id: "owner-tenant", name: "Outra Loja" },
});

for (const viewport of [
  { name: "mobile", width: 390, height: 844 },
  { name: "tablet", width: 820, height: 1180 },
  { name: "desktop", width: 1440, height: 960 },
]) {
  test(`Cliente real em ${viewport.name}: login, skeleton, decimais e identificação`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    await page.addInitScript(
      ({ key, owner, signedIn }) => {
        localStorage.setItem("smartbiz.session", owner);
        if (signedIn) localStorage.setItem(key, "customer-jwt");
        const runtime = window as unknown as Window & { ownerReads: number };
        runtime.ownerReads = 0;
        const original = Storage.prototype.getItem;
        Storage.prototype.getItem = function (key) {
          if (key === "smartbiz.session") runtime.ownerReads += 1;
          return original.call(this, key);
        };
      },
      {
        key: tokenKey,
        owner: ownerSession,
        signedIn: viewport.name !== "mobile",
      },
    );

    let release!: () => void;
    const firstResponse = new Promise<void>((resolve) => {
      release = resolve;
    });
    let calls = 0;
    let payload = b2cDashboardResponse;
    await page.route("**/b2c/dashboard", async (route) => {
      expect(route.request().headers().authorization).toBe(
        "Bearer customer-jwt",
      );
      calls += 1;
      if (calls === 1) await firstResponse;
      await route.fulfill({ json: payload });
    });
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto("/cliente/dashboard");
    if (viewport.name === "mobile") {
      await expect(page).toHaveURL(/\/cliente\/dev-login$/);
      await expect(
        page.getByRole("heading", { name: "Dev Login B2C" }),
      ).toBeVisible();
      await page.getByLabel("JWT B2C").fill("customer-jwt");
      await page.getByRole("button", { name: "Entrar", exact: true }).click();
    }
    await expect(
      page.getByRole("status", { name: "Carregando seu dashboard" }),
    ).toBeVisible();
    await expect(
      page.getByRole("status", { name: "Saldo de pontos" }),
    ).toHaveCount(0);
    await page.screenshot({
      path: `test-results/cliente-loading-${viewport.name}.png`,
    });
    release();
    await expect(
      page.getByRole("heading", { name: "Olá, João Silva!" }),
    ).toBeVisible();
    await expect(
      page.getByRole("status", { name: "Saldo de pontos" }),
    ).toContainText("125");
    const amount = page.getByRole("article", { name: "Cliente Ouro" });
    await expect(amount.getByRole("progressbar")).toHaveAttribute(
      "aria-valuenow",
      "49.9",
    );
    await expect(amount.getByText(/100,10 em compras/)).toBeVisible();
    expect(
      await page.evaluate(
        () => (window as unknown as Window & { ownerReads: number }).ownerReads,
      ),
    ).toBe(0);
    await expect(page.getByRole("complementary")).toHaveCount(0);
    await page.screenshot({
      path: `test-results/cliente-real-${viewport.name}.png`,
      fullPage: true,
    });

    const trigger = page.getByRole("button", {
      name: "Meu QR Code",
      exact: true,
    });
    await trigger.click();
    const drawer = page.getByRole("dialog");
    await expect(drawer.getByText("João Silva", { exact: true })).toBeVisible();
    await expect(
      drawer.getByText("(11) 99999-0000", { exact: true }),
    ).toBeVisible();
    await expect(drawer.getByRole("button", { name: "Pronto" })).toBeInViewport(
      { ratio: 1 },
    );
    await drawer.getByRole("button", { name: "Pronto" }).click();
    await expect(trigger).toBeFocused();
    await page
      .getByRole("navigation", { name: "Navegação do cliente" })
      .getByRole("link", { name: "Missões", exact: true })
      .click();
    await page.evaluate(() =>
      window.scrollTo(0, document.documentElement.scrollHeight),
    );
    const last = await page.getByRole("article").last().boundingBox();
    const nav = await page
      .getByRole("navigation", { name: "Navegação do cliente" })
      .boundingBox();
    expect(last!.y + last!.height).toBeLessThanOrEqual(nav!.y);

    payload = { ...b2cDashboardResponse, pointsBalance: 200 };
    await page.getByRole("button", { name: "Atualizar dashboard" }).click();
    await expect(
      page.getByRole("status", { name: "Saldo de pontos" }),
    ).toContainText("200");
    await page.reload();
    await expect(
      page.getByRole("heading", { name: "Olá, João Silva!" }),
    ).toBeVisible();
    expect(
      await page.evaluate((key) => localStorage.getItem(key), tokenKey),
    ).toBe("customer-jwt");
    expect(
      await page.evaluate(() => localStorage.getItem("smartbiz.session")),
    ).toBe(ownerSession);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    expect(errors).toEqual([]);
  });
}

for (const status of [401, 403]) {
  test(`JWT B2C recusado com ${status} mantém a sessão B2B`, async ({
    page,
  }) => {
    await page.addInitScript(
      ({ key, owner }) => {
        localStorage.setItem(key, "invalid-customer-token");
        localStorage.setItem("smartbiz.session", owner);
      },
      { key: tokenKey, owner: ownerSession },
    );
    let calls = 0;
    await page.route("**/b2c/dashboard", (route) => {
      calls += 1;
      return route.fulfill({ status, json: { message: "Unauthorized" } });
    });
    await page.goto("/cliente/dashboard");
    await expect(page).toHaveURL(/\/cliente\/dev-login$/);
    await expect(page.getByRole("main").getByRole("alert")).toContainText(
      status === 401 ? "Seu token expirou" : "role B2C",
    );
    expect(
      await page.evaluate((key) => localStorage.getItem(key), tokenKey),
    ).toBeNull();
    expect(
      await page.evaluate(() => localStorage.getItem("smartbiz.session")),
    ).toBe(ownerSession);
    expect(calls).toBe(1);
  });
}

test("troca de cliente descarta saldo e identificação da sessão anterior", async ({
  page,
}) => {
  await page.addInitScript(
    (key) => localStorage.setItem(key, "customer-a"),
    tokenKey,
  );
  await page.route("**/b2c/dashboard", (route) => {
    const second =
      route.request().headers().authorization === "Bearer customer-b";
    return route.fulfill({
      json: second
        ? {
            ...b2cDashboardResponse,
            customer: {
              id: "other-id",
              name: "Beatriz",
              phone: "(21) 98888-7777",
            },
            pointsBalance: 9,
            missions: [],
          }
        : b2cDashboardResponse,
    });
  });
  await page.goto("/cliente/dashboard");
  await expect(
    page.getByText("Olá, João Silva!", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Sair do App do Cliente" }).click();
  await expect(page).toHaveURL(/\/cliente\/dev-login$/);
  await page.getByLabel("JWT B2C").fill("customer-b");
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await expect(page.getByText("Olá, Beatriz!", { exact: true })).toBeVisible();
  await expect(page.getByText("Olá, João Silva!", { exact: true })).toHaveCount(
    0,
  );
  await expect(
    page.getByRole("status", { name: "Saldo de pontos" }),
  ).toContainText("9");
  await page.getByRole("button", { name: "Meu QR Code", exact: true }).click();
  await expect(
    page.getByRole("dialog").getByText("(21) 98888-7777", { exact: true }),
  ).toBeVisible();
});

test("erro de rede oferece nova tentativa sem saldo fictício", async ({
  page,
}) => {
  await page.addInitScript(
    (key) => localStorage.setItem(key, "customer-jwt"),
    tokenKey,
  );
  let calls = 0;
  await page.route("**/b2c/dashboard", (route) => {
    calls += 1;
    return calls === 1
      ? route.fulfill({ status: 503, json: { message: "Unavailable" } })
      : route.fulfill({ json: b2cDashboardResponse });
  });
  await page.goto("/cliente/dashboard");
  await expect(page.getByRole("main").getByRole("alert")).toContainText(
    "Verifique sua conexão",
  );
  await expect(
    page.getByRole("status", { name: "Saldo de pontos" }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "Tentar novamente" }).click();
  await expect(
    page.getByRole("heading", { name: "Olá, João Silva!" }),
  ).toBeVisible();
});
