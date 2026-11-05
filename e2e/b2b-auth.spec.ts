import { expect, test } from "playwright/test";
import { b2bAuthResponse } from "../tests/fixtures/b2b-auth";

for (const viewport of [
  { name: "mobile", width: 390, height: 844 },
  { name: "desktop", width: 1440, height: 960 },
]) {
  test(`Login B2B em ${viewport.name}: guard, sessão, reload e logout`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    await page.addInitScript(() => {
      localStorage.setItem("@smartbiz:b2c_token", "independent-customer-token");
    });
    let calls = 0;
    await page.route("**/auth/login", async (route) => {
      calls += 1;
      expect(route.request().method()).toBe("POST");
      expect(route.request().postDataJSON()).toEqual({
        email: "ana@example.com",
        password: "senha1234",
      });
      expect(route.request().headers().authorization).toBeUndefined();
      await route.fulfill({ json: b2bAuthResponse });
    });
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto("/painel");
    await expect(page).toHaveURL(/\/login$/);
    await expect(
      page.getByRole("heading", { name: "Entrar no painel" }),
    ).toBeVisible();
    await expect(page.getByRole("complementary")).toHaveCount(0);
    await page.screenshot({
      path: `test-results/login-${viewport.name}.png`,
      fullPage: true,
    });
    await page.getByLabel("E-mail", { exact: true }).fill("ana@example.com");
    await page.getByLabel("Senha", { exact: true }).fill("senha1234");
    await page.getByRole("button", { name: "Entrar", exact: true }).click();
    await expect(page).toHaveURL(/\/painel$/);
    await expect(
      page.getByRole("heading", { name: "Início", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByText("Login realizado com sucesso!", { exact: true }),
    ).toBeVisible();
    const session = await page.evaluate(() =>
      JSON.parse(localStorage.getItem("smartbiz.session")!),
    );
    expect(session.accessToken).toBe(b2bAuthResponse.access_token);
    expect(session.tenant).toEqual(b2bAuthResponse.tenant);
    await page.reload();
    await expect(
      page.getByRole("heading", { name: "Início", exact: true }),
    ).toBeVisible();
    expect(calls).toBe(1);
    if (viewport.width < 1024)
      await page.getByRole("button", { name: "Abrir menu" }).click();
    await page.getByRole("button", { name: "Sair", exact: true }).click();
    await expect(page).toHaveURL(/\/login$/);
    expect(
      await page.evaluate(() => localStorage.getItem("smartbiz.session")),
    ).toBeNull();
    expect(
      await page.evaluate(() => localStorage.getItem("@smartbiz:b2c_token")),
    ).toBe("independent-customer-token");
    await page.goto("/painel/missoes");
    await expect(page).toHaveURL(/\/login$/);
    expect(errors).toEqual([]);
  });
}

test("Cadastro usa o contrato oficial e inicia sessão automaticamente", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  let submitted = false;
  await page.route("**/auth/register", async (route) => {
    expect(route.request().postDataJSON()).toEqual({
      tenantName: "Café Central",
      userName: "Ana Silva",
      email: "ana@example.com",
      password: "senha1234",
    });
    submitted = true;
    await route.fulfill({ status: 201, json: b2bAuthResponse });
  });
  await page.goto("/register");
  await expect(
    page.getByRole("heading", { name: "Crie sua conta" }),
  ).toBeVisible();
  await page.screenshot({
    path: "test-results/register-mobile.png",
    fullPage: true,
  });
  await page.getByLabel("Nome do estabelecimento").fill("Café Central");
  await page.getByLabel("Seu nome", { exact: true }).fill("Ana Silva");
  await page.getByLabel("E-mail", { exact: true }).fill("ana@example.com");
  await page.getByLabel("Senha", { exact: true }).fill("senha1234");
  await page.getByRole("button", { name: "Criar conta", exact: true }).click();
  await expect(page).toHaveURL(/\/painel$/);
  await expect(
    page.getByText("Conta criada com sucesso!", { exact: true }),
  ).toBeVisible();
  expect(submitted).toBe(true);
});

test("Login inválido preserva campos e informa erro; cadastro duplicado também", async ({
  page,
}) => {
  await page.route("**/auth/login", (route) =>
    route.fulfill({ status: 401, json: { message: "Unauthorized" } }),
  );
  await page.goto("/login");
  await page.getByLabel("E-mail", { exact: true }).fill("ana@example.com");
  await page.getByLabel("Senha", { exact: true }).fill("senha1234");
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await expect(page.getByRole("main").getByRole("alert")).toContainText(
    "Credenciais inválidas",
  );
  await expect(page.getByLabel("E-mail", { exact: true })).toHaveValue(
    "ana@example.com",
  );
  expect(
    await page.evaluate(() => localStorage.getItem("smartbiz.session")),
  ).toBeNull();
  await page.route("**/auth/register", (route) =>
    route.fulfill({ status: 409, json: { message: "Conflict" } }),
  );
  await page.goto("/register");
  await page.getByLabel("Nome do estabelecimento").fill("Café Central");
  await page.getByLabel("Seu nome", { exact: true }).fill("Ana Silva");
  await page.getByLabel("E-mail", { exact: true }).fill("ana@example.com");
  await page.getByLabel("Senha", { exact: true }).fill("senha1234");
  await page.getByRole("button", { name: "Criar conta", exact: true }).click();
  await expect(page.getByRole("main").getByRole("alert")).toContainText(
    "Já existe uma conta",
  );
});

test("JWT expirado em chamada do painel redireciona para login", async ({
  page,
}) => {
  await page.addInitScript(
    (session) =>
      localStorage.setItem(
        "smartbiz.session",
        JSON.stringify({
          accessToken: session.access_token,
          user: session.user,
          tenant: session.tenant,
        }),
      ),
    b2bAuthResponse,
  );
  await page.route("**/missions", (route) =>
    route.fulfill({ status: 401, json: { message: "Unauthorized" } }),
  );
  await page.goto("/painel/missoes");
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole("main").getByRole("alert")).toContainText(
    "Sua sessão expirou",
  );
});

test("Caminhos antigos de autenticação levam às novas páginas", async ({
  page,
}) => {
  await page.goto("/entrar");
  await expect(page).toHaveURL(/\/login$/);
  await page.goto("/cadastro");
  await expect(page).toHaveURL(/\/register$/);
});
