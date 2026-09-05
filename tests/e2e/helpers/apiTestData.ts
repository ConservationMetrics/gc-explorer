import { randomUUID } from "node:crypto";

import { and, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";

import { viewConfig as viewsTable } from "@/server/database/schemas/viewConfig";
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
  const configDb = drizzle(configSql);
  const warehouseSql = createTestDatabaseClient(TEST_WAREHOUSE_DATABASE);

  try {
    await warehouseSql.unsafe(
      `CREATE TABLE ${quoteIdentifier(primaryDataset)} AS TABLE ${quoteIdentifier(input.sourceTable)}`,
    );
    await configDb.insert(viewsTable).values({
      primaryDataset,
      secondaryDataset: input.secondaryDataset ?? null,
      viewConfig: JSON.stringify(input.viewConfig),
      viewName: primaryDataset,
      viewType: input.viewType,
    });

    return {
      primaryDataset,
      secondaryDataset: input.secondaryDataset ?? null,
      viewType: input.viewType,
    };
  } catch (error) {
    await configDb
      .delete(viewsTable)
      .where(eq(viewsTable.primaryDataset, primaryDataset));
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
  const configDb = drizzle(configSql);
  const warehouseSql = createTestDatabaseClient(TEST_WAREHOUSE_DATABASE);

  try {
    await configDb
      .delete(viewsTable)
      .where(
        and(
          eq(viewsTable.primaryDataset, view.primaryDataset),
          eq(viewsTable.viewType, view.viewType),
        ),
      );
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
