import {
  AxiosError,
  AxiosHeaders,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from "axios";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { b2cApi } from "@/lib/axios";
import { useAuthStore } from "@/store/useAuthStore";
import { B2C_TOKEN_KEY, useB2CAuthStore } from "@/store/useB2CAuthStore";

beforeEach(() => {
  vi.restoreAllMocks();
  localStorage.clear();
  useB2CAuthStore.setState({
    token: null,
    hydrated: false,
    sessionVersion: 0,
    message: null,
  });
  useAuthStore.setState({ accessToken: "owner-token" });
});

function response(
  config: InternalAxiosRequestConfig,
  status = 200,
): AxiosResponse {
  return {
    data: {},
    status,
    statusText: "",
    headers: new AxiosHeaders(),
    config,
  };
}

describe("autenticação B2C isolada", () => {
  it("hidrata apenas a chave B2C", () => {
    localStorage.setItem(B2C_TOKEN_KEY, "customer-token");
    const get = vi.spyOn(Storage.prototype, "getItem");
    useB2CAuthStore.getState().hydrate();
    expect(get).toHaveBeenCalledExactlyOnceWith(B2C_TOKEN_KEY);
    expect(useB2CAuthStore.getState().token).toBe("customer-token");
  });

  it("envia o token B2C em Authorization mesmo com sessão B2B ativa", async () => {
    useB2CAuthStore.getState().setToken("customer-token");
    await b2cApi.get("/b2c/dashboard", {
      adapter: async (config) => {
        expect(config.headers.get("Authorization")).toBe(
          "Bearer customer-token",
        );
        return response(config);
      },
    });
    expect(useAuthStore.getState().accessToken).toBe("owner-token");
  });

  it.each([401, 403])(
    "limpa somente a sessão B2C no erro %i",
    async (status) => {
      localStorage.setItem("smartbiz.session", "owner-session");
      useB2CAuthStore.getState().setToken("customer-token");
      await expect(
        b2cApi.get("/b2c/dashboard", {
          adapter: async (config) => {
            throw new AxiosError(
              "rejected",
              undefined,
              config,
              undefined,
              response(config, status),
            );
          },
        }),
      ).rejects.toBeInstanceOf(AxiosError);
      expect(useB2CAuthStore.getState().token).toBeNull();
      expect(localStorage.getItem(B2C_TOKEN_KEY)).toBeNull();
      expect(localStorage.getItem("smartbiz.session")).toBe("owner-session");
      expect(useAuthStore.getState().accessToken).toBe("owner-token");
    },
  );

  it("não encerra uma sessão nova por causa de um 401 atrasado da anterior", async () => {
    useB2CAuthStore.getState().setToken("old-token");
    let rejectRequest!: (error: AxiosError) => void;
    let started!: () => void;
    const ready = new Promise<void>((resolve) => {
      started = resolve;
    });
    let requestConfig!: InternalAxiosRequestConfig;
    const result = b2cApi
      .get("/b2c/dashboard", {
        adapter: (config) => {
          requestConfig = config;
          started();
          return new Promise((_resolve, reject) => {
            rejectRequest = reject;
          });
        },
      })
      .catch((error: unknown) => error);
    await ready;
    useB2CAuthStore.getState().setToken("new-token");
    rejectRequest(
      new AxiosError(
        "expired",
        undefined,
        requestConfig,
        undefined,
        response(requestConfig, 401),
      ),
    );
    await result;
    expect(useB2CAuthStore.getState().token).toBe("new-token");
  });
});
