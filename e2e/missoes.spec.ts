import { expect, test } from "playwright/test";
import type {
  CreateMissionInput,
  Mission,
  MissionStatus,
} from "../src/lib/missions";

const tenant = {
  id: "missions-e2e",
  name: "Loja de teste",
  slug: "teste",
  plan: "test",
  whatsappNumber: null,
};
const seed: Mission[] = [
  {
    id: "visits",
    name: "Fã de Carteirinha",
    goalType: "VISITS",
    targetValue: 3,
    reward: "1 Café e 1 Croissant",
    status: "ACTIVE",
    expiresAt: null,
  },
  {
    id: "amount",
    name: "Comprador VIP",
    goalType: "AMOUNT",
    targetValue: 150.5,
    reward: "20% de desconto na próxima compra",
    status: "INACTIVE",
    expiresAt: null,
  },
  {
    id: "return",
    name: "Sempre por perto",
    goalType: "VISITS",
    targetValue: 5,
    reward: "Um café da manhã para duas pessoas",
    status: "ACTIVE",
    expiresAt: "2030-12-31T23:59:59.000Z",
  },
];

for (const viewport of [
  { name: "desktop", width: 1440, height: 1000 },
  { name: "tablet", width: 820, height: 1180 },
  { name: "mobile", width: 390, height: 844 },
]) {
  test(`Missões em ${viewport.name}: listar, alterar status e criar por valor gasto`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    await page.addInitScript(
      (session) => {
        localStorage.setItem("smartbiz.session", JSON.stringify(session));
      },
      {
        accessToken: "missions-e2e-token",
        user: {
          id: "missions-owner",
          name: "Dono",
          email: "test@example.com",
          role: "OWNER",
        },
        tenant,
      },
    );
    await page.route("**/tenants/me", (route) =>
      route.fulfill({ json: tenant }),
    );
    let list = seed.map((mission) => ({ ...mission }));
    const created: CreateMissionInput[] = [];
    await page.route("**/missions", async (route) => {
      expect(route.request().headers().authorization).toBe(
        "Bearer missions-e2e-token",
      );
      if (route.request().method() === "GET")
        return route.fulfill({ json: list });
      const payload = route.request().postDataJSON() as CreateMissionInput;
      created.push(payload);
      const mission: Mission = {
        ...payload,
        id: "new-mission",
        status: "ACTIVE",
      };
      list = [...list, mission];
      await route.fulfill({ status: 201, json: mission });
    });
    await page.route("**/missions/*/status", async (route) => {
      const { status } = route.request().postDataJSON() as {
        status: MissionStatus;
      };
      expect(route.request().method()).toBe("PATCH");
      expect(status).toBe("INACTIVE");
      list = list.map((mission) =>
        mission.id === "visits" ? { ...mission, status } : mission,
      );
      await route.fulfill({ json: list[0] });
    });
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto("/painel/missoes");
    await expect(
      page.getByRole("heading", { name: "Missões e Desafios", exact: true }),
    ).toBeVisible();
    await expect(page.getByRole("article")).toHaveCount(3);
    await expect(page.getByText("Sem expiração", { exact: true })).toHaveCount(
      2,
    );
    await page.screenshot({
      path: `test-results/missoes-${viewport.name}.png`,
      fullPage: true,
    });

    const first = page.getByRole("article", { name: "Fã de Carteirinha" });
    await first.getByRole("switch").click();
    await expect(first.getByRole("switch")).not.toBeChecked();
    await expect(
      page.getByText("Missão desativada!", { exact: true }),
    ).toBeVisible();

    await page
      .getByRole("button", { name: "Nova Missão", exact: true })
      .click();
    const sheet = page.getByRole("dialog");
    await expect(sheet).toBeVisible();
    await expect(sheet.getByLabel("Nome da Missão")).toBeFocused();
    await sheet.getByLabel("Nome da Missão").fill("Meta de compras");
    await sheet.getByRole("combobox").click();
    await page.getByRole("option", { name: "Por Valor Gasto" }).click();
    await sheet.getByLabel("Objetivo (R$)").fill("150.999");
    await sheet
      .getByLabel("Recompensa", { exact: true })
      .fill("1 Café especial");
    await sheet.getByRole("button", { name: "Salvar Missão" }).click();
    await expect(
      sheet.getByText("Use no máximo duas casas decimais para o valor gasto."),
    ).toBeVisible();
    expect(created).toHaveLength(0);
    await sheet.getByLabel("Objetivo (R$)").fill("150.50");
    await page.screenshot({
      path: `test-results/missoes-sheet-${viewport.name}.png`,
      fullPage: true,
    });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await sheet.getByRole("button", { name: "Salvar Missão" }).click();
    await expect(sheet).toBeHidden();
    await expect(
      page.getByText("Missão criada!", { exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("article", { name: "Meta de compras" }),
    ).toBeVisible();
    expect(created).toEqual([
      {
        name: "Meta de compras",
        goalType: "AMOUNT",
        targetValue: 150.5,
        reward: "1 Café especial",
        expiresAt: null,
      },
    ]);
    expect(errors).toEqual([]);
  });
}
