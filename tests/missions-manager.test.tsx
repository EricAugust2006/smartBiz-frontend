import React from "react";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MissionsManager } from "@/components/missions/missions-manager";
import { ToasterProvider } from "@/components/ui/toaster";
import { api } from "@/lib/axios";
import type { Mission } from "@/lib/missions";
import { useAuthStore } from "@/store/useAuthStore";

const firstMission: Mission = {
  id: "mission-a",
  name: "Fã de Carteirinha",
  goalType: "VISITS",
  targetValue: 3,
  reward: "1 Café e 1 Croissant",
  status: "ACTIVE",
  expiresAt: null,
};
const clients: QueryClient[] = [];

beforeEach(() => {
  vi.restoreAllMocks();
  useAuthStore.setState({
    accessToken: "test-token",
    hydrated: true,
    tenantVerified: true,
    tenant: {
      id: "tenant-a",
      name: "Loja A",
      slug: "a",
      plan: "test",
      whatsappNumber: null,
    },
    user: {
      id: "user-a",
      name: "Dono",
      email: "test@example.com",
      role: "OWNER",
    },
  });
});

afterEach(() => {
  clients.splice(0).forEach((client) => client.clear());
});

function renderManager() {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: Infinity },
      mutations: { retry: false, gcTime: Infinity },
    },
  });
  clients.push(client);
  render(
    <QueryClientProvider client={client}>
      <ToasterProvider>
        <MissionsManager />
      </ToasterProvider>
    </QueryClientProvider>,
  );
  return client;
}

async function openAndFillForm() {
  const user = userEvent.setup();
  await user.click(screen.getByRole("button", { name: "Nova Missão" }));
  await user.type(screen.getByLabelText("Nome da Missão"), "Cliente Fiel");
  await user.type(screen.getByLabelText("Objetivo", { exact: true }), "3");
  await user.type(
    screen.getByLabelText("Recompensa", { exact: true }),
    "1 Café",
  );
  return user;
}

describe("gestão de missões", () => {
  it("mostra skeletons até receber a lista, incluindo missões inativas", async () => {
    let resolveGet!: (result: { data: Mission[] }) => void;
    vi.spyOn(api, "get").mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveGet = resolve;
        }),
    );
    renderManager();
    expect(
      screen.getByRole("status", { name: "Carregando missões" }),
    ).toBeTruthy();
    await act(async () => {
      resolveGet({
        data: [
          firstMission,
          {
            ...firstMission,
            id: "mission-b",
            name: "Comprador VIP",
            goalType: "AMOUNT",
            targetValue: 150,
            status: "INACTIVE",
          },
        ],
      });
    });
    expect(
      await screen.findByRole("article", { name: "Fã de Carteirinha" }),
    ).toBeTruthy();
    expect(screen.getByRole("article", { name: "Comprador VIP" })).toBeTruthy();
    expect(screen.getAllByText("Sem expiração")).toHaveLength(2);
    expect(screen.getByText("1 ativa · 1 inativa")).toBeTruthy();
  });

  it("distingue erro de lista vazia e permite tentar novamente", async () => {
    const get = vi
      .spyOn(api, "get")
      .mockRejectedValueOnce(new Error("offline"))
      .mockResolvedValue({ data: [] });
    renderManager();
    expect(await screen.findByRole("alert")).toHaveProperty(
      "textContent",
      expect.stringContaining("Não foi possível carregar"),
    );
    expect(screen.queryByText("Sua primeira missão começa aqui")).toBeNull();
    await userEvent.click(
      screen.getByRole("button", { name: "Tentar novamente" }),
    );
    expect(
      await screen.findByText("Sua primeira missão começa aqui"),
    ).toBeTruthy();
    expect(get).toHaveBeenCalledTimes(2);
  });

  it("cria com o payload correto, recarrega a lista, fecha o Sheet e notifica", async () => {
    const get = vi.spyOn(api, "get").mockResolvedValue({ data: [] });
    const post = vi.spyOn(api, "post").mockResolvedValue({ data: {} });
    renderManager();
    await screen.findByText("Sua primeira missão começa aqui");
    const user = await openAndFillForm();
    await user.click(screen.getByRole("button", { name: "Salvar Missão" }));
    await waitFor(() =>
      expect(post).toHaveBeenCalledWith("/missions", {
        name: "Cliente Fiel",
        goalType: "VISITS",
        targetValue: 3,
        reward: "1 Café",
        expiresAt: null,
      }),
    );
    expect(await screen.findByText("Missão criada!")).toBeTruthy();
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(get.mock.calls.length).toBeGreaterThan(1);
  });

  it("mantém o formulário e a mensagem de erro após falha de criação", async () => {
    vi.spyOn(api, "get").mockResolvedValue({ data: [] });
    const post = vi
      .spyOn(api, "post")
      .mockRejectedValueOnce(new Error("offline"))
      .mockResolvedValue({ data: {} });
    renderManager();
    await screen.findByText("Sua primeira missão começa aqui");
    const user = await openAndFillForm();
    await user.click(screen.getByRole("button", { name: "Salvar Missão" }));
    expect(await screen.findByRole("alert")).toHaveProperty(
      "textContent",
      expect.stringContaining("Não foi possível criar"),
    );
    expect(
      (screen.getByLabelText("Nome da Missão") as HTMLInputElement).value,
    ).toBe("Cliente Fiel");
    await user.click(screen.getByRole("button", { name: "Salvar Missão" }));
    expect(await screen.findByText("Missão criada!")).toBeTruthy();
    expect(post).toHaveBeenCalledTimes(2);
  });

  it("não envia uma missão de visitas com objetivo fracionado", async () => {
    vi.spyOn(api, "get").mockResolvedValue({ data: [] });
    const post = vi.spyOn(api, "post");
    renderManager();
    await screen.findByText("Sua primeira missão começa aqui");
    const user = await openAndFillForm();
    await user.clear(screen.getByLabelText("Objetivo", { exact: true }));
    await user.type(screen.getByLabelText("Objetivo", { exact: true }), "1.5");
    await user.click(screen.getByRole("button", { name: "Salvar Missão" }));
    expect(
      await screen.findByText(/número inteiro de pelo menos 1/),
    ).toBeTruthy();
    expect(post).not.toHaveBeenCalled();
  });

  it("preserva o status se PATCH falhar e bloqueia cliques repetidos enquanto salva", async () => {
    let list = [firstMission];
    vi.spyOn(api, "get").mockImplementation(async () => ({ data: list }));
    let resolvePatch!: (result: { data: object }) => void;
    const patch = vi
      .spyOn(api, "patch")
      .mockRejectedValueOnce(new Error("offline"))
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            resolvePatch = resolve;
          }),
      );
    renderManager();
    const card = await screen.findByRole("article", {
      name: firstMission.name,
    });
    const toggle = within(card).getByRole("switch");
    await userEvent.click(toggle);
    expect(await within(card).findByRole("alert")).toHaveProperty(
      "textContent",
      expect.stringContaining("estado anterior foi mantido"),
    );
    expect(toggle.getAttribute("aria-checked")).toBe("true");
    fireEvent.click(toggle);
    fireEvent.click(toggle);
    await waitFor(() => expect(patch).toHaveBeenCalledTimes(2));
    expect((toggle as HTMLButtonElement).disabled).toBe(true);
    expect(patch).toHaveBeenLastCalledWith("/missions/mission-a/status", {
      status: "INACTIVE",
    });
    list = [{ ...firstMission, status: "INACTIVE" }];
    await act(async () => {
      resolvePatch({ data: {} });
    });
    await waitFor(() =>
      expect(toggle.getAttribute("aria-checked")).toBe("false"),
    );
    expect(await screen.findByText("Missão desativada!")).toBeTruthy();
  });

  it("limpa dados da lista ao trocar a loja", async () => {
    vi.spyOn(api, "get")
      .mockResolvedValueOnce({ data: [firstMission] })
      .mockResolvedValueOnce({ data: [] });
    renderManager();
    await screen.findByRole("article", { name: firstMission.name });
    act(() => {
      useAuthStore.setState({
        tenant: {
          id: "tenant-b",
          name: "Loja B",
          slug: "b",
          plan: "test",
          whatsappNumber: null,
        },
      });
    });
    expect(
      screen.queryByRole("article", { name: firstMission.name }),
    ).toBeNull();
    expect(
      await screen.findByText("Sua primeira missão começa aqui"),
    ).toBeTruthy();
  });
});
