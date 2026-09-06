import { config } from "dotenv";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  createTestDatabaseClient,
  TEST_CONFIG_DATABASE,
} from "./helpers/testDatabase";
import { isNuxtTestEnv } from "../../utils/nuxtTestEnv";

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(__dirname, "../..");

config({ path: resolve(projectRoot, ".env.test.playwright") });

// Must match docker-compose.tests.yml (database service + guardianconnector DB).
const TEST_BACKEND_URL = "http://localhost:8080";
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

  const seedPath = resolve(projectRoot, "tests/db-seed/guardianconnector.sql");

  if (!existsSync(seedPath)) {
    throw new Error(`Test fixture seed not found: ${seedPath}`);
  }

  await waitForBackend();

  const sql = createTestDatabaseClient(TEST_CONFIG_DATABASE);

  try {
    await sql.unsafe(readFileSync(seedPath, "utf-8"));
  } finally {
    await sql.end({ timeout: 5 });
  }
}
