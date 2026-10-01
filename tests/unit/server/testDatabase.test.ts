// @vitest-environment node
import { afterEach, beforeEach, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ postgres: vi.fn(), config: vi.fn() }));
vi.mock("postgres", () => ({ default: mocks.postgres }));
vi.mock("dotenv", () => ({ config: mocks.config, parse: () => ({}) }));
vi.mock("node:fs", () => ({ existsSync: () => false, readFileSync: vi.fn() }));

beforeEach(() => {
  vi.resetModules();
  vi.clearAllMocks();
  mocks.config.mockReset();
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

it("loads optional overrides before resolving database constants", async () => {
  mocks.config.mockImplementation(() => {
    for (const [key, value] of Object.entries({
      NUXT_TEST_DB_HOST: "db",
      NUXT_TEST_DB_PORT: "5432",
      NUXT_TEST_DB_USER: "postgres",
      NUXT_TEST_DB_PASSWORD: "postgres",
      NUXT_TEST_CONFIG_DATABASE: "guardianconnector_test",
    }))
      vi.stubEnv(key, value);
  });
  const db = await import("../../e2e/helpers/testDatabase");
  for (const database of [
    db.TEST_CONFIG_DATABASE,
    db.TEST_WAREHOUSE_DATABASE,
  ]) {
    db.createTestDatabaseClient(database);
    expect(mocks.postgres).toHaveBeenLastCalledWith({
      host: "db",
      port: 5432,
      username: "postgres",
      password: "postgres",
      database,
      ssl: false,
      max: 1,
    });
  }
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

it.each(["NUXT_TEST_CONFIG_DATABASE", "NUXT_TEST_DATABASE"])(
  "rejects unsafe %s before any connection is created",
  async (setting) => {
    vi.stubEnv("NUXT_TEST_DB_HOST", "db");
    vi.stubEnv("NUXT_TEST_DB_PORT", "5432");
    vi.stubEnv(setting, "guardianconnector");
    const db = await import("../../e2e/helpers/testDatabase");
    expect(() => db.createTestDatabaseClient(db.TEST_CONFIG_DATABASE)).toThrow(
      /development database/,
    );
    expect(mocks.postgres).not.toHaveBeenCalled();
  },
);
