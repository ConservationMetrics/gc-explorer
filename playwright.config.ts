import { defineConfig } from "@playwright/test";
import { config } from "dotenv";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

// Load .env.test file for test environment
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
config({ path: resolve(__dirname, ".env.test") });

export default defineConfig({
  testDir: "e2e",
  ...(process.env.CI
    ? {}
    : {
        webServer: {
          command: "pnpm dev",
          url: "http://localhost:8080",
          timeout: 200_000,
          reuseExistingServer: false,
          stdout: "pipe",
          stderr: "pipe",
        },
      }),
  use: {
    baseURL: "http://localhost:8080",
    headless: true,
  },
  workers: process.env.CI ? 1 : undefined,
});
