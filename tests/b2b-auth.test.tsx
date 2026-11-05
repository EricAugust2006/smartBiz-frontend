import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  AxiosError,
  AxiosHeaders,
  type InternalAxiosRequestConfig,
} from "axios";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { B2BAuthForm } from "@/components/auth/b2b-auth-form";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { ToasterProvider } from "@/components/ui/toaster";
import { api } from "@/lib/axios";
import {
  authResponseSchema,
  loginFormSchema,
  registerFormSchema,
} from "@/lib/auth";
import { B2B_SESSION_KEY, useAuthStore } from "@/store/useAuthStore";
import { B2C_TOKEN_KEY } from "@/store/useB2CAuthStore";
import { b2bAuthResponse } from "./fixtures/b2b-auth";

const { replace } = vi.hoisted(() => ({ replace: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace }) }));
const clients: QueryClient[] = [];

beforeEach(() => {
  vi.restoreAllMocks();
  replace.mockClear();
  localStorage.clear();
  useAuthStore.setState({
    accessToken: null,
    user: null,
    tenant: null,
    hydrated: true,
    tenantVerified: false,
    sessionVersion: 0,
    message: null,
  });
});
afterEach(() => {
  clients.splice(0).forEach((client) => client.clear());
});

function renderForm(mode: "login" | "register") {
  const client = new QueryClient({
    defaultOptions: {
      queries: { gcTime: Infinity },
      mutations: { retry: false, gcTime: Infinity },
    },
  });
  clients.push(client);
  return render(
    <QueryClientProvider client={client}>
      <ToasterProvider>
        <B2BAuthForm mode={mode} />
      </ToasterProvider>
    </QueryClientProvider>,
  );
}

async function fillLogin() {
  const user = userEvent.setup();
  await user.type(screen.getByLabelText("E-mail"), "ana@example.com");
  await user.type(screen.getByLabelText("Senha", { exact: true }), "senha1234");
  return user;
}

function response(config: InternalAxiosRequestConfig, status = 200) {
  return {
    data: {},
    status,
    statusText: "",
    headers: new AxiosHeaders(),
    config,
  };
}

describe("fluxo B2B", () => {
  it("aceita o contrato sem user.tenant ou campos adicionais da empresa", () => {
    expect(authResponseSchema.parse(b2bAuthResponse)).toEqual(b2bAuthResponse);
    expect(
      authResponseSchema.safeParse({
        ...b2bAuthResponse,
        user: { ...b2bAuthResponse.user, role: "B2C" },
      }).success,
    ).toBe(false);
  });

  it("valida os campos sem modificar a senha enviada", () => {
    expect(
      loginFormSchema.parse({ email: " ana@example.com ", password: " x " }),
    ).toEqual({ email: "ana@example.com", password: " x " });
    expect(
      registerFormSchema.safeParse({
        tenantName: " ",
        userName: "Ana",
        email: "invalid",
        password: "123",
      }).success,
    ).toBe(false);
  });

  it("faz login, persiste o JWT e exibe sucesso", async () => {
    const post = vi
      .spyOn(api, "post")
      .mockResolvedValue({ data: b2bAuthResponse });
    localStorage.setItem(B2C_TOKEN_KEY, "customer-token");
    renderForm("login");
    const user = await fillLogin();
    await user.click(screen.getByRole("button", { name: "Entrar" }));
    expect(
      await screen.findByText("Login realizado com sucesso!"),
    ).toBeTruthy();
    expect(post).toHaveBeenCalledExactlyOnceWith("/auth/login", {
      email: "ana@example.com",
      password: "senha1234",
    });
    expect(JSON.parse(localStorage.getItem(B2B_SESSION_KEY)!)).toEqual({
      accessToken: b2bAuthResponse.access_token,
      user: b2bAuthResponse.user,
      tenant: b2bAuthResponse.tenant,
    });
    expect(localStorage.getItem(B2C_TOKEN_KEY)).toBe("customer-token");
    expect(replace).toHaveBeenCalledWith("/painel");
  });

  it("registra com o payload oficial e inicia a sessão", async () => {
    const post = vi
      .spyOn(api, "post")
      .mockResolvedValue({ data: b2bAuthResponse });
    renderForm("register");
    const user = await fillLogin();
    await user.type(
      screen.getByLabelText("Nome do estabelecimento"),
      "Café Central",
    );
    await user.type(screen.getByLabelText("Seu nome"), "Ana Silva");
    await user.click(screen.getByRole("button", { name: "Criar conta" }));
    expect(await screen.findByText("Conta criada com sucesso!")).toBeTruthy();
    expect(post).toHaveBeenCalledExactlyOnceWith("/auth/register", {
      tenantName: "Café Central",
      userName: "Ana Silva",
      email: "ana@example.com",
      password: "senha1234",
    });
    expect(useAuthStore.getState().accessToken).toBe(
      b2bAuthResponse.access_token,
    );
  });

  it("faz login após o cadastro real que retorna apenas tenant e user", async () => {
    const { access_token: _token, ...registration } = b2bAuthResponse;
    const post = vi.spyOn(api, "post")
      .mockResolvedValueOnce({ data: registration })
      .mockResolvedValueOnce({ data: b2bAuthResponse });
    renderForm("register");
    const user = await fillLogin();
    await user.type(screen.getByLabelText("Nome do estabelecimento"), "Café Central");
    await user.type(screen.getByLabelText("Seu nome"), "Ana Silva");
    await user.click(screen.getByRole("button", { name: "Criar conta" }));
    expect(await screen.findByText("Conta criada com sucesso!")).toBeTruthy();
    expect(post).toHaveBeenNthCalledWith(1, "/auth/register", {
      tenantName: "Café Central", userName: "Ana Silva",
      email: "ana@example.com", password: "senha1234",
    });
    expect(post).toHaveBeenNthCalledWith(2, "/auth/login", {
      email: "ana@example.com", password: "senha1234",
    });
    expect(useAuthStore.getState().accessToken).toBe(b2bAuthResponse.access_token);
    expect(replace).toHaveBeenCalledWith("/painel");
  });

  it("rejeita resposta de cadastro inválida antes de tentar login", async () => {
    const post = vi.spyOn(api, "post").mockResolvedValue({ data: {} });
    renderForm("register");
    const user = await fillLogin();
    await user.type(screen.getByLabelText("Nome do estabelecimento"), "Café Central");
    await user.type(screen.getByLabelText("Seu nome"), "Ana Silva");
    await user.click(screen.getByRole("button", { name: "Criar conta" }));
    expect((await screen.findByRole("alert")).textContent).toContain("sessão inválida");
    expect(post).toHaveBeenCalledTimes(1);
    expect(useAuthStore.getState().accessToken).toBeNull();
  });

  it("não envia formulário inválido", async () => {
    const post = vi.spyOn(api, "post");
    renderForm("register");
    await userEvent.click(screen.getByRole("button", { name: "Criar conta" }));
    expect(
      await screen.findByText("Informe o nome do estabelecimento."),
    ).toBeTruthy();
    expect(post).not.toHaveBeenCalled();
  });

  it("mostra credenciais inválidas e permite tentar novamente", async () => {
    const error = new AxiosError("invalid", undefined, undefined, undefined, {
      data: {},
      status: 401,
      statusText: "",
      headers: {},
      config: { headers: new AxiosHeaders() },
    });
    const post = vi
      .spyOn(api, "post")
      .mockRejectedValueOnce(error)
      .mockResolvedValue({ data: b2bAuthResponse });
    renderForm("login");
    const user = await fillLogin();
    await user.click(screen.getByRole("button", { name: "Entrar" }));
    expect((await screen.findByRole("alert")).textContent).toContain(
      "Credenciais inválidas",
    );
    expect(localStorage.getItem(B2B_SESSION_KEY)).toBeNull();
    await user.click(screen.getByRole("button", { name: "Entrar" }));
    expect(
      await screen.findByText("Login realizado com sucesso!"),
    ).toBeTruthy();
    expect(post).toHaveBeenCalledTimes(2);
  });

  it("não redireciona nem inicia sessão se o armazenamento estiver bloqueado", async () => {
    vi.spyOn(api, "post").mockResolvedValue({ data: b2bAuthResponse });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    renderForm("login");
    const user = await fillLogin();
    await user.click(screen.getByRole("button", { name: "Entrar" }));
    expect((await screen.findByRole("alert")).textContent).toContain(
      "Não foi possível salvar",
    );
    expect(replace).not.toHaveBeenCalled();
    expect(useAuthStore.getState().accessToken).toBeNull();
  });

  it("restaura a sessão pelo contrato oficial e rejeita JSON corrompido", () => {
    localStorage.setItem(
      B2B_SESSION_KEY,
      JSON.stringify({
        accessToken: b2bAuthResponse.access_token,
        user: b2bAuthResponse.user,
        tenant: b2bAuthResponse.tenant,
      }),
    );
    useAuthStore.setState({ hydrated: false });
    useAuthStore.getState().hydrate();
    expect(useAuthStore.getState().tenant?.slug).toBe("cafe-central");
    useAuthStore.getState().syncSession("invalid-json");
    expect(useAuthStore.getState().accessToken).toBeNull();
    expect(localStorage.getItem(B2B_SESSION_KEY)).toBeNull();
  });

  it("guard não mostra conteúdo antes de hidratar ou quando deslogado", async () => {
    useAuthStore.setState({ hydrated: false });
    const { rerender } = render(
      <ProtectedRoute>
        <p>Conteúdo protegido</p>
      </ProtectedRoute>,
    );
    expect(screen.queryByText("Conteúdo protegido")).toBeNull();
    expect(replace).not.toHaveBeenCalled();
    useAuthStore.setState({ hydrated: true });
    rerender(
      <ProtectedRoute>
        <p>Conteúdo protegido</p>
      </ProtectedRoute>,
    );
    await waitFor(() => expect(replace).toHaveBeenCalledWith("/login"));
    expect(screen.queryByText("Conteúdo protegido")).toBeNull();
  });

  it("Axios injeta o JWT B2B, mas não o envia para login/register", async () => {
    useAuthStore.getState().setSession(b2bAuthResponse);
    for (const path of ["/missions", "/auth/login", "/auth/register"]) {
      await api.get(path, {
        adapter: async (config) => {
          expect(config.headers.get("Authorization")).toBe(
            path === "/missions"
              ? `Bearer ${b2bAuthResponse.access_token}`
              : undefined,
          );
          return response(config);
        },
      });
    }
  });

  it("401 em rota protegida encerra apenas a sessão B2B", async () => {
    useAuthStore.getState().setSession(b2bAuthResponse);
    localStorage.setItem(B2C_TOKEN_KEY, "customer-token");
    await expect(
      api.get("/missions", {
        adapter: async (config) => {
          throw new AxiosError(
            "expired",
            undefined,
            config,
            undefined,
            response(config, 401),
          );
        },
      }),
    ).rejects.toBeInstanceOf(AxiosError);
    expect(useAuthStore.getState().accessToken).toBeNull();
    expect(localStorage.getItem(B2C_TOKEN_KEY)).toBe("customer-token");
  });
});
