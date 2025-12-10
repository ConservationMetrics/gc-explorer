import { defineConfig, devices } from "@playwright/test";
import { config } from "dotenv";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

// Load .env.test.playwright file for test environment
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
config({ path: resolve(__dirname, ".env.test.playwright") });

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
          // Server logs (including middleware console.log) will appear in test output
          stdout: "pipe",
          stderr: "pipe",
        },
      }),
  projects: [
    // Setup project - runs authentication before all tests
    {
      name: "setup",
      testMatch: /.*\.setup\.ts/,
    },
    // Default project - runs all tests without authentication
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        baseURL: "http://localhost:8080",
        headless: true,
      },
      dependencies: ["setup"],
    },
  ],
  use: {
    baseURL: "http://localhost:8080",
    headless: true,
  },
});
