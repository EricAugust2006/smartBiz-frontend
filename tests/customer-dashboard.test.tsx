import React from "react";
import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CustomerDashboard } from "@/components/customer/customer-dashboard";
import { B2CDevLogin } from "@/components/customer/b2c-dev-login";
import { CustomerMissionList } from "@/components/customer/customer-mission-list";
import { Progress } from "@/components/ui/progress";
import { b2cApi } from "@/lib/axios";
import { b2cDashboardSchema } from "@/lib/customer-dashboard";
import { B2C_TOKEN_KEY, useB2CAuthStore } from "@/store/useB2CAuthStore";
import { useAuthStore } from "@/store/useAuthStore";
import { b2cDashboardResponse } from "./fixtures/b2c-dashboard";

const { replace } = vi.hoisted(() => ({ replace: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace }) }));

const clients: QueryClient[] = [];
beforeEach(() => {
  vi.restoreAllMocks();
  replace.mockClear();
  localStorage.clear();
  useB2CAuthStore.setState({
    token: "b2c-test-token",
    hydrated: true,
    sessionVersion: 1,
    message: null,
  });
});
afterEach(() => {
  clients.splice(0).forEach((client) => client.clear());
});

function renderDashboard() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: Infinity } },
  });
  clients.push(client);
  const view = render(
    <QueryClientProvider client={client}>
      <CustomerDashboard />
    </QueryClientProvider>,
  );
  return { ...view, client };
}

describe("dashboard B2C real", () => {
  it("normaliza decimais e exibe os valores recebidos", async () => {
    vi.spyOn(b2cApi, "get").mockResolvedValue({ data: b2cDashboardResponse });
    renderDashboard();
    expect(
      await screen.findByRole("heading", { name: "Olá, João Silva!" }),
    ).toBeTruthy();
    expect(
      screen.getByRole("status", { name: "Saldo de pontos" }).textContent,
    ).toBe("125pontos");
    const card = screen.getByRole("article", { name: "Cliente Ouro" });
    expect(
      within(card).getByRole("progressbar").getAttribute("aria-valuenow"),
    ).toBe("49.9");
    expect(
      within(card).getByRole("progressbar").getAttribute("aria-valuemax"),
    ).toBe("150");
    expect(within(card).getByText(/100,10 em compras/)).toBeTruthy();
    expect(screen.queryByText(/VIP|Marina|Padaria Aurora/)).toBeNull();
  });

  it("mostra skeletons, sem saldo ou identificação falsos, durante a requisição", async () => {
    let resolveGet!: (result: { data: unknown }) => void;
    vi.spyOn(b2cApi, "get").mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveGet = resolve;
        }),
    );
    renderDashboard();
    expect(
      screen.getByRole("status", { name: "Carregando seu dashboard" }),
    ).toBeTruthy();
    expect(
      screen.queryByRole("status", { name: "Saldo de pontos" }),
    ).toBeNull();
    expect(screen.queryByRole("button", { name: "Meu QR Code" })).toBeNull();
    await act(async () => {
      resolveGet({ data: b2cDashboardResponse });
    });
    expect(await screen.findByText("Olá, João Silva!")).toBeTruthy();
  });

  it("recupera uma falha de rede e trata lista vazia", async () => {
    const get = vi
      .spyOn(b2cApi, "get")
      .mockRejectedValueOnce(new Error("offline"))
      .mockResolvedValue({
        data: { ...b2cDashboardResponse, pointsBalance: 0, missions: [] },
      });
    renderDashboard();
    expect(await screen.findByRole("alert")).toHaveProperty(
      "textContent",
      expect.stringContaining("Verifique sua conexão"),
    );
    expect(screen.queryByText("Novas missões estão chegando")).toBeNull();
    await userEvent.click(
      screen.getByRole("button", { name: "Tentar novamente" }),
    );
    expect(
      await screen.findByText("Novas missões estão chegando"),
    ).toBeTruthy();
    expect(
      screen.getByRole("status", { name: "Saldo de pontos" }).textContent,
    ).toBe("0pontos");
    expect(get).toHaveBeenCalledTimes(2);
  });

  it("rejeita resposta inválida sem converter texto inválido em progresso zero", async () => {
    vi.spyOn(b2cApi, "get").mockResolvedValue({
      data: {
        ...b2cDashboardResponse,
        missions: [
          { ...b2cDashboardResponse.missions[0], currentProgress: "inválido" },
        ],
      },
    });
    renderDashboard();
    expect(await screen.findByRole("alert")).toHaveProperty(
      "textContent",
      expect.stringContaining("formato inesperado"),
    );
    expect(screen.queryByRole("article")).toBeNull();
  });

  it("usa isCompleted do servidor como fonte da conclusão", () => {
    const data = b2cDashboardSchema.parse({
      ...b2cDashboardResponse,
      missions: [
        {
          ...b2cDashboardResponse.missions[0],
          currentProgress: 3,
          isCompleted: false,
          remaining: 0,
        },
      ],
    });
    render(<CustomerMissionList missions={data.missions} />);
    expect(screen.getByText("Em andamento")).toBeTruthy();
    expect(screen.queryByText("Concluída")).toBeNull();
  });

  it("não chama a API sem JWT e direciona para Dev Login", async () => {
    useB2CAuthStore.setState({ token: null });
    const get = vi.spyOn(b2cApi, "get");
    renderDashboard();
    await waitFor(() =>
      expect(replace).toHaveBeenCalledWith("/cliente/dev-login"),
    );
    expect(get).not.toHaveBeenCalled();
  });

  it("reutiliza o cache na mesma sessão e isola a troca de token", async () => {
    const get = vi
      .spyOn(b2cApi, "get")
      .mockResolvedValueOnce({ data: b2cDashboardResponse })
      .mockImplementationOnce(() => new Promise(() => {}));
    const { client, rerender } = renderDashboard();
    await screen.findByText("Olá, João Silva!");
    rerender(
      <QueryClientProvider client={client}>
        <CustomerDashboard />
      </QueryClientProvider>,
    );
    expect(get).toHaveBeenCalledTimes(1);
    act(() => {
      useB2CAuthStore.getState().setToken("another-b2c-token");
    });
    expect(screen.queryByText("Olá, João Silva!")).toBeNull();
    await waitFor(() => expect(get).toHaveBeenCalledTimes(2));
  });

  it("não hidrata a sessão B2B e mantém os dados quando o lojista muda", async () => {
    const hydrate = vi.spyOn(useAuthStore.getState(), "hydrate");
    vi.spyOn(b2cApi, "get").mockResolvedValue({ data: b2cDashboardResponse });
    renderDashboard();
    await screen.findByText("Olá, João Silva!");
    act(() => {
      useAuthStore.setState({ accessToken: "owner-token" });
    });
    expect(hydrate).not.toHaveBeenCalled();
    expect(screen.getByText("Olá, João Silva!")).toBeTruthy();
  });

  it("Dev Login salva somente a chave B2C e oculta o token no input", async () => {
    useB2CAuthStore.setState({ token: null });
    localStorage.setItem("smartbiz.session", "owner-session");
    render(<B2CDevLogin />);
    const input = screen.getByLabelText("JWT B2C") as HTMLInputElement;
    expect(input.type).toBe("password");
    await userEvent.type(input, "customer-token");
    await userEvent.click(screen.getByRole("button", { name: "Entrar" }));
    expect(localStorage.getItem(B2C_TOKEN_KEY)).toBe("customer-token");
    expect(localStorage.getItem("smartbiz.session")).toBe("owner-session");
    expect(replace).toHaveBeenCalledWith("/cliente/dashboard");
  });

  it("mostra erro de armazenamento sem perder o JWT digitado", async () => {
    useB2CAuthStore.setState({ token: null });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    render(<B2CDevLogin />);
    await userEvent.type(screen.getByLabelText("JWT B2C"), "customer-token");
    await userEvent.click(screen.getByRole("button", { name: "Entrar" }));
    expect(await screen.findByRole("alert")).toHaveProperty(
      "textContent",
      expect.stringContaining("Não foi possível salvar"),
    );
    expect((screen.getByLabelText("JWT B2C") as HTMLInputElement).value).toBe(
      "customer-token",
    );
    expect(replace).not.toHaveBeenCalled();
  });

  it("limita barras de progresso inválidas", () => {
    render(<Progress aria-label="Teste" value={Number.NaN} max={0} />);
    expect(screen.getByRole("progressbar").getAttribute("aria-valuenow")).toBe(
      "0",
    );
    expect(screen.getByRole("progressbar").getAttribute("aria-valuemax")).toBe(
      "100",
    );
  });
});
