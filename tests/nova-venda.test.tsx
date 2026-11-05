import React from "react";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AxiosError, AxiosHeaders, type AxiosResponse } from "axios";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NovaVenda } from "@/components/sales/nova-venda";
import { ToasterProvider } from "@/components/ui/toaster";
import { api } from "@/lib/axios";
import { useAuthStore } from "@/store/useAuthStore";
import type { CreateSaleInput } from "@/lib/sales";

function response(data: unknown, status = 200): AxiosResponse<unknown> {
  return {
    data,
    status,
    statusText: "",
    headers: {},
    config: { headers: new AxiosHeaders() },
  };
}

function httpError(status: number) {
  return new AxiosError(
    "Request failed",
    undefined,
    undefined,
    undefined,
    response({}, status),
  );
}

const clients: QueryClient[] = [];

afterEach(() => {
  clients.splice(0).forEach((client) => client.clear());
});

function renderPDV() {
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
        <NovaVenda />
      </ToasterProvider>
    </QueryClientProvider>,
  );
  return client;
}

async function fillSale() {
  const user = userEvent.setup();
  await user.type(screen.getByLabelText("Valor da Venda (R$)"), "1050");
  await user.type(screen.getByLabelText("Telefone do Cliente"), "11987654321");
  await user.tab();
  return user;
}

beforeEach(() => {
  vi.restoreAllMocks();
  useAuthStore.setState({
    accessToken: "test-token",
    hydrated: true,
    tenantVerified: true,
    tenant: {
      id: "tenant-a",
      name: "Loja",
      slug: "loja",
      plan: "test",
      whatsappNumber: null,
    },
    user: {
      id: "user-a",
      name: "Caixa",
      email: "test@example.com",
      role: "OWNER",
    },
  });
});

describe("NovaVenda", () => {
  it("consulta no blur, mostra o nome e envia reais, telefone sem máscara e UUID; depois limpa e notifica", async () => {
    const get = vi
      .spyOn(api, "get")
      .mockResolvedValue(response({ name: "João Silva" }));
    const post = vi.spyOn(api, "post").mockResolvedValue(response({}));
    renderPDV();
    const user = await fillSale();
    expect(await screen.findByText("João Silva")).toBeTruthy();
    expect(get).toHaveBeenCalledWith(
      "/customers/by-phone",
      expect.objectContaining({ params: { phone: "11987654321" } }),
    );
    await user.click(screen.getByRole("button", { name: "Confirmar Venda" }));
    await waitFor(() => expect(post).toHaveBeenCalledTimes(1));
    expect(post).toHaveBeenCalledWith("/sales", {
      amount: 10.5,
      customerPhone: "11987654321",
      idempotencyKey: expect.stringMatching(
        /^[\da-f]{8}-[\da-f]{4}-4[\da-f]{3}-[89ab][\da-f]{3}-[\da-f]{12}$/i,
      ),
    });
    expect(await screen.findByText("Venda confirmada!")).toBeTruthy();
    await waitFor(() =>
      expect(document.activeElement).toBe(
        screen.getByLabelText("Valor da Venda (R$)"),
      ),
    );
    expect(
      (screen.getByLabelText("Valor da Venda (R$)") as HTMLInputElement).value,
    ).toBe("");
    expect(
      (screen.getByLabelText("Telefone do Cliente") as HTMLInputElement).value,
    ).toBe("");
    await fillSale();
    await user.click(screen.getByRole("button", { name: "Confirmar Venda" }));
    await waitFor(() => expect(post).toHaveBeenCalledTimes(2));
    expect((post.mock.calls[1][1] as CreateSaleInput).idempotencyKey).not.toBe(
      (post.mock.calls[0][1] as CreateSaleInput).idempotencyKey,
    );
  });

  it("exibe Novo Cliente no 404 e permite registrar a venda", async () => {
    vi.spyOn(api, "get").mockRejectedValue(httpError(404));
    const post = vi.spyOn(api, "post").mockResolvedValue(response({}));
    renderPDV();
    const user = await fillSale();
    expect(await screen.findByText("Novo Cliente")).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "Confirmar Venda" }));
    await waitFor(() => expect(post).toHaveBeenCalledTimes(1));
  });

  it("distingue falha na consulta de cliente novo e oferece recuperação", async () => {
    const get = vi
      .spyOn(api, "get")
      .mockRejectedValueOnce(httpError(500))
      .mockResolvedValue(response({ name: "Cliente recuperado" }));
    renderPDV();
    const user = await fillSale();
    expect(await screen.findByText(/Não foi possível consultar/)).toBeTruthy();
    expect(screen.queryByText("Novo Cliente")).toBeNull();
    await user.click(
      screen.getByRole("button", { name: "Tentar consultar novamente" }),
    );
    expect(await screen.findByText("Cliente recuperado")).toBeTruthy();
    expect(get).toHaveBeenCalledTimes(2);
  });

  it("mantém os dados e a mesma chave após falha e impede envios simultâneos", async () => {
    vi.spyOn(api, "get").mockResolvedValue(response({ name: "João" }));
    let resolvePost!: (value: AxiosResponse<unknown>) => void;
    const post = vi
      .spyOn(api, "post")
      .mockRejectedValueOnce(new AxiosError("timeout"))
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            resolvePost = resolve;
          }),
      );
    renderPDV();
    const user = await fillSale();
    await user.click(screen.getByRole("button", { name: "Confirmar Venda" }));
    expect(await screen.findByRole("alert")).toHaveProperty(
      "textContent",
      expect.stringContaining("Não foi possível confirmar"),
    );
    expect(
      (screen.getByLabelText("Telefone do Cliente") as HTMLInputElement).value,
    ).toBe("(11) 98765-4321");
    const button = screen.getByRole("button", { name: "Confirmar Venda" });
    fireEvent.click(button);
    fireEvent.click(button);
    await waitFor(() => expect(post).toHaveBeenCalledTimes(2));
    expect(post.mock.calls[1][1]).toEqual(post.mock.calls[0][1]);
    expect(
      (
        screen.getByRole("button", {
          name: "Confirmando venda…",
        }) as HTMLButtonElement
      ).disabled,
    ).toBe(true);
    await act(async () => {
      resolvePost(response({}));
    });
    expect(await screen.findByText("Venda confirmada!")).toBeTruthy();
  });

  it("não envia formulário vazio ou valor zero", async () => {
    const post = vi.spyOn(api, "post");
    renderPDV();
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Confirmar Venda" }));
    expect(await screen.findByText("Informe um valor válido.")).toBeTruthy();
    expect(post).not.toHaveBeenCalled();
    await user.type(screen.getByLabelText("Valor da Venda (R$)"), "0");
    await user.type(
      screen.getByLabelText("Telefone do Cliente"),
      "11987654321",
    );
    await user.click(screen.getByRole("button", { name: "Confirmar Venda" }));
    expect(await screen.findByText(/pelo menos R\$ 0,01/)).toBeTruthy();
    expect(post).not.toHaveBeenCalled();
  });

  it("ignora resposta antiga quando o telefone é alterado durante a consulta", async () => {
    let resolveGet!: (value: AxiosResponse<unknown>) => void;
    vi.spyOn(api, "get").mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveGet = resolve;
        }),
    );
    renderPDV();
    const user = await fillSale();
    expect(screen.getByText("Buscando cliente…")).toBeTruthy();
    await user.clear(screen.getByLabelText("Telefone do Cliente"));
    await user.type(
      screen.getByLabelText("Telefone do Cliente"),
      "21999999999",
    );
    await act(async () => {
      resolveGet(response({ name: "Cliente anterior" }));
    });
    expect(screen.queryByText("Cliente anterior")).toBeNull();
  });

  it("isola o resultado de cliente por loja", async () => {
    vi.spyOn(api, "get")
      .mockResolvedValueOnce(response({ name: "Cliente loja A" }))
      .mockResolvedValueOnce(response({ name: "Cliente loja B" }));
    renderPDV();
    await fillSale();
    expect(await screen.findByText("Cliente loja A")).toBeTruthy();
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
    expect(screen.queryByText("Cliente loja A")).toBeNull();
    expect(await screen.findByText("Cliente loja B")).toBeTruthy();
  });
});
