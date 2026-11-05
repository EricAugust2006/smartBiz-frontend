import { defineConfig } from "playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 2,
  timeout: 60_000,
  expect: { timeout: 15_000 },
  use: { baseURL: "http://127.0.0.1:3101", channel: "msedge", headless: true },
  webServer: {
    command:
      "node node_modules/next/dist/bin/next dev --hostname 127.0.0.1 --port 3101",
    url: "http://127.0.0.1:3101/painel/nova-venda",
    timeout: 120_000,
    reuseExistingServer: false,
  },
});
