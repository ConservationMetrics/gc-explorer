import { config } from "dotenv";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { isNuxtTestEnv } from "../../utils/nuxtTestEnv";

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(__dirname, "../..");

config({ path: resolve(projectRoot, ".env.test.playwright") });

const TEST_BACKEND_URL = process.env.E2E_BASE_URL || "http://localhost:8080";
async function waitForBackend(timeoutMs = 120_000) {
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    try {
      const response = await fetch(TEST_BACKEND_URL);
      if (response.ok) return;
    } catch {
      // Backend not ready yet.
    }
    await new Promise((resolve) => setTimeout(resolve, 2_000));
  }

  throw new Error(
    `Backend not ready at ${TEST_BACKEND_URL} after ${timeoutMs}ms`,
  );
}

export default async function globalSetup() {
  if (!isNuxtTestEnv()) return;

  await waitForBackend();
}
