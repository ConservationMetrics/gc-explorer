import postgres from "postgres";
import { config, parse } from "dotenv";
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const inheritedEnvironment = { ...process.env };
config({
  path: fileURLToPath(
    new URL("../../../.env.test.playwright", import.meta.url),
  ),
});

export const TEST_DB_HOST = process.env.NUXT_TEST_DB_HOST || "127.0.0.1";
export const TEST_DB_PORT = Number(process.env.NUXT_TEST_DB_PORT || 5433);
export const TEST_DB_USER = process.env.NUXT_TEST_DB_USER || "testuser";
export const TEST_DB_PASSWORD =
  process.env.NUXT_TEST_DB_PASSWORD ?? "testpassword";
export const TEST_CONFIG_DATABASE =
  process.env.NUXT_TEST_CONFIG_DATABASE || "guardianconnector";
export const TEST_WAREHOUSE_DATABASE =
  process.env.NUXT_TEST_DATABASE || "test_warehouse";

/** Only customized connections need a new isolation check; preserve the existing defaults. */
const assertIsolatedOverrides = (database: string) => {
  if (
    !Object.keys(process.env).some(
      (key) =>
        key.startsWith("NUXT_TEST_DB_") ||
        ["NUXT_TEST_CONFIG_DATABASE", "NUXT_TEST_DATABASE"].includes(key),
    )
  )
    return;
  const developmentEnvPath = fileURLToPath(
    new URL("../../../.env", import.meta.url),
  );
  const developmentEnvironment = {
    ...(existsSync(developmentEnvPath)
      ? parse(readFileSync(developmentEnvPath))
      : {}),
    ...inheritedEnvironment,
  };
  const normalizeHost = (host: string) =>
    ["localhost", "127.0.0.1", "::1", "[::1]"].includes(host.toLowerCase())
      ? "localhost"
      : host.toLowerCase();
  const sameServer =
    normalizeHost(TEST_DB_HOST) ===
      normalizeHost(developmentEnvironment.NUXT_DB_HOST || "localhost") &&
    TEST_DB_PORT === Number(developmentEnvironment.NUXT_DB_PORT || 5432);
  const developmentDatabases = [
    developmentEnvironment.NUXT_CONFIG_DATABASE || "guardianconnector",
    developmentEnvironment.NUXT_DATABASE || "warehouse",
  ];
  if (
    sameServer &&
    [TEST_CONFIG_DATABASE, TEST_WAREHOUSE_DATABASE, database].some((target) =>
      developmentDatabases.includes(target),
    )
  ) {
    throw new Error(
      "E2E database overrides point to a development database; use an isolated test database",
    );
  }
};

/**
 * Creates a single-connection client for a test database.
 *
 * @param database - Database name on the test Postgres service.
 * @returns Postgres client for test setup or teardown.
 */
export const createTestDatabaseClient = (database: string) => {
  assertIsolatedOverrides(database);
  return postgres({
    host: TEST_DB_HOST,
    port: TEST_DB_PORT,
    database,
    username: TEST_DB_USER,
    password: TEST_DB_PASSWORD,
    ssl: false,
    max: 1,
  });
};
