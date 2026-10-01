// @vitest-environment node
import { afterEach, beforeEach, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ postgres: vi.fn() }));
vi.mock("postgres", () => ({ default: mocks.postgres }));

beforeEach(() => {
  vi.resetModules();
  vi.clearAllMocks();
  for (const key of [
    "NUXT_TEST_DB_HOST",
    "NUXT_TEST_DB_PORT",
    "NUXT_TEST_DB_USER",
    "NUXT_TEST_DB_PASSWORD",
    "NUXT_TEST_CONFIG_DATABASE",
    "NUXT_TEST_DATABASE",
  ])
    vi.stubEnv(key, undefined);
  vi.stubEnv("NUXT_DB_HOST", "db");
  vi.stubEnv("NUXT_DB_PORT", "5432");
  vi.stubEnv("NUXT_CONFIG_DATABASE", "guardianconnector");
  vi.stubEnv("NUXT_DATABASE", "warehouse");
});
afterEach(() => vi.unstubAllEnvs());

it("preserves the original connection defaults", async () => {
  vi.stubEnv("NUXT_DB_HOST", "127.0.0.1");
  vi.stubEnv("NUXT_DB_PORT", "5433");
  const db = await import("../../e2e/helpers/testDatabase");
  db.createTestDatabaseClient(db.TEST_CONFIG_DATABASE);
  expect(mocks.postgres).toHaveBeenCalledWith({
    host: "127.0.0.1",
    port: 5433,
    username: "testuser",
    password: "testpassword",
    database: "guardianconnector",
    ssl: false,
    max: 1,
  });
  expect(db.TEST_WAREHOUSE_DATABASE).toBe("test_warehouse");
});

it("uses inherited workspace settings without a local database configuration file", async () => {
  vi.stubEnv("NUXT_TEST_DB_HOST", "db");
  vi.stubEnv("NUXT_TEST_DB_PORT", "5432");
  vi.stubEnv("NUXT_TEST_DB_USER", "postgres");
  vi.stubEnv("NUXT_TEST_DB_PASSWORD", "postgres");
  vi.stubEnv("NUXT_TEST_CONFIG_DATABASE", "guardianconnector_test");
  vi.stubEnv("NUXT_TEST_DATABASE", "test_warehouse");
  const db = await import("../../e2e/helpers/testDatabase");
  db.createTestDatabaseClient(db.TEST_CONFIG_DATABASE);
  expect(mocks.postgres).toHaveBeenCalledWith({
    host: "db",
    port: 5432,
    username: "postgres",
    password: "postgres",
    database: "guardianconnector_test",
    ssl: false,
    max: 1,
  });
});
