import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "e2e",
  webServer: {
    command: "pnpm dev",
    url: "http://localhost:8080",
    timeout: 200_000,
    reuseExistingServer: false,
  },
  use: {
    baseURL: "http://localhost:8080",
    headless: false,
  },
});
