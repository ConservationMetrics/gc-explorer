import postgres from "postgres";

export const TEST_DB_HOST = process.env.NUXT_TEST_DB_HOST || "127.0.0.1";
export const TEST_DB_PORT = Number(process.env.NUXT_TEST_DB_PORT || 5433);
export const TEST_DB_USER = process.env.NUXT_TEST_DB_USER || "testuser";
export const TEST_DB_PASSWORD =
  process.env.NUXT_TEST_DB_PASSWORD ?? "testpassword";
export const TEST_CONFIG_DATABASE =
  process.env.NUXT_TEST_CONFIG_DATABASE || "guardianconnector";
export const TEST_WAREHOUSE_DATABASE =
  process.env.NUXT_TEST_DATABASE || "test_warehouse";

/**
 * Creates a single-connection client for a test database.
 *
 * @param database - Database name on the test Postgres service.
 * @returns Postgres client for test setup or teardown.
 */
export const createTestDatabaseClient = (database: string) =>
  postgres({
    host: TEST_DB_HOST,
    port: TEST_DB_PORT,
    database,
    username: TEST_DB_USER,
    password: TEST_DB_PASSWORD,
    ssl: false,
    max: 1,
  });
