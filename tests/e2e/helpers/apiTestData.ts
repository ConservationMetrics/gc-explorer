import { randomUUID } from "node:crypto";

import type { ApiTestView, ApiTestViewInput } from "@/types";
import {
  createTestDatabaseClient,
  TEST_CONFIG_DATABASE,
  TEST_WAREHOUSE_DATABASE,
} from "./testDatabase";

const quoteIdentifier = (value: string): string =>
  `"${value.replaceAll('"', '""')}"`;

/**
 * Creates a unique warehouse table and its matching view row for one API test.
 *
 * @param input - Source table and view fields needed by the test.
 * @returns {Promise<ApiTestView>} Identity used by the route and teardown.
 */
export const createApiTestView = async (
  input: ApiTestViewInput,
): Promise<ApiTestView> => {
  const primaryDataset = `api_test_${randomUUID().replaceAll("-", "").slice(0, 12)}`;
  const configSql = createTestDatabaseClient(TEST_CONFIG_DATABASE);
  const warehouseSql = createTestDatabaseClient(TEST_WAREHOUSE_DATABASE);

  try {
    await warehouseSql.unsafe(
      `CREATE TABLE ${quoteIdentifier(primaryDataset)} AS TABLE ${quoteIdentifier(input.sourceTable)}`,
    );
    await configSql`
      INSERT INTO views (
        view_name,
        view_type,
        primary_dataset,
        secondary_dataset,
        view_config
      )
      VALUES (
        ${primaryDataset},
        ${input.viewType},
        ${primaryDataset},
        ${input.secondaryDataset ?? null},
        ${JSON.stringify(input.viewConfig)}
      )
    `;

    return {
      primaryDataset,
      secondaryDataset: input.secondaryDataset ?? null,
      viewType: input.viewType,
    };
  } catch (error) {
    await configSql`
      DELETE FROM views
      WHERE primary_dataset = ${primaryDataset}
    `;
    await warehouseSql.unsafe(
      `DROP TABLE IF EXISTS ${quoteIdentifier(primaryDataset)}`,
    );
    throw error;
  } finally {
    await Promise.all([
      configSql.end({ timeout: 5 }),
      warehouseSql.end({ timeout: 5 }),
    ]);
  }
};

/**
 * Deletes one test-owned view row and its copied warehouse table.
 *
 * @param view - Identity returned by createApiTestView.
 * @returns {Promise<void>}
 */
export const deleteApiTestView = async (view: ApiTestView): Promise<void> => {
  const configSql = createTestDatabaseClient(TEST_CONFIG_DATABASE);
  const warehouseSql = createTestDatabaseClient(TEST_WAREHOUSE_DATABASE);

  try {
    await configSql`
      DELETE FROM views
      WHERE primary_dataset = ${view.primaryDataset}
        AND view_type = ${view.viewType}
    `;
    await warehouseSql.unsafe(
      `DROP TABLE IF EXISTS ${quoteIdentifier(view.primaryDataset)}`,
    );
  } finally {
    await Promise.all([
      configSql.end({ timeout: 5 }),
      warehouseSql.end({ timeout: 5 }),
    ]);
  }
};
