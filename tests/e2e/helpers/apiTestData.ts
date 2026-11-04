import { randomUUID } from "node:crypto";

import { and, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import type { Sql } from "postgres";

import { publicViews } from "@/server/database/schemas/publicViews";
import { viewConfig as viewsTable } from "@/server/database/schemas/viewConfig";
import type {
  ApiTestView,
  ApiTestViewInput,
  WarehouseTestTable,
} from "@/types";
import {
  createTestDatabaseClient,
  TEST_CONFIG_DATABASE,
  TEST_WAREHOUSE_DATABASE,
} from "./testDatabase";

const quoteIdentifier = (value: string): string =>
  `"${value.replaceAll('"', '""')}"`;

/**
 * Creates a warehouse table with text columns and inserts its rows.
 *
 * @param database - Warehouse database client.
 * @param tableName - Name of the table to create.
 * @param table - Columns and rows for the table.
 * @returns {Promise<void>}
 */
const createWarehouseTable = async (
  database: Sql,
  tableName: string,
  { columns, rows }: WarehouseTestTable,
): Promise<void> => {
  const columnDefinitions = columns
    .map((column) => `${quoteIdentifier(column)} text`)
    .join(", ");
  await database.unsafe(
    `CREATE TABLE ${quoteIdentifier(tableName)} (${columnDefinitions})`,
  );
  const unknownColumns = rows
    .flatMap(Object.keys)
    .filter((column) => !columns.includes(column));
  if (unknownColumns.length > 0) {
    throw new Error(
      `Rows use undeclared columns: ${unknownColumns.join(", ")}`,
    );
  }
  const values = rows.map((row) =>
    Object.fromEntries(columns.map((column) => [column, row[column] ?? null])),
  );
  await database`INSERT INTO ${database(tableName)} ${database(values, columns)}`;
};

/**
 * Creates unique warehouse tables and the matching view row for one test.
 *
 * @param input - Warehouse tables and view fields needed by the test.
 * @returns {Promise<ApiTestView>} Identity used by the route and teardown.
 */
export const createApiTestView = async (
  input: ApiTestViewInput,
): Promise<ApiTestView> => {
  const primaryDataset = `api_test_${randomUUID().replaceAll("-", "").slice(0, 12)}`;
  const secondaryDataset = input.secondaryTable
    ? `${primaryDataset}_secondary`
    : null;
  const configSql = createTestDatabaseClient(TEST_CONFIG_DATABASE);
  const configDb = drizzle(configSql);
  const warehouseSql = createTestDatabaseClient(TEST_WAREHOUSE_DATABASE);

  try {
    await createWarehouseTable(warehouseSql, primaryDataset, input.table);
    if (input.secondaryTable && secondaryDataset) {
      await createWarehouseTable(
        warehouseSql,
        secondaryDataset,
        input.secondaryTable,
      );
    }
    const [{ viewId }] = await configDb
      .insert(viewsTable)
      .values({
        primaryDataset,
        secondaryDataset,
        viewConfig: JSON.stringify(input.viewConfig),
        viewName: primaryDataset,
        viewType: input.viewType,
      })
      .returning({ viewId: viewsTable.viewId });
    // The app lists "anyone" views in public_views when it saves them.
    if (input.viewConfig.ROUTE_LEVEL_PERMISSION === "anyone") {
      await configDb.insert(publicViews).values({ viewId });
    }

    return {
      primaryDataset,
      secondaryDataset,
      viewType: input.viewType,
    };
  } catch (error) {
    await configDb
      .delete(viewsTable)
      .where(eq(viewsTable.primaryDataset, primaryDataset));
    await warehouseSql.unsafe(
      `DROP TABLE IF EXISTS ${quoteIdentifier(primaryDataset)}`,
    );
    if (secondaryDataset) {
      await warehouseSql.unsafe(
        `DROP TABLE IF EXISTS ${quoteIdentifier(secondaryDataset)}`,
      );
    }
    throw error;
  } finally {
    await Promise.all([
      configSql.end({ timeout: 5 }),
      warehouseSql.end({ timeout: 5 }),
    ]);
  }
};

/**
 * Deletes one test-owned view row and its warehouse tables.
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
    if (view.secondaryDataset) {
      await warehouseSql.unsafe(
        `DROP TABLE IF EXISTS ${quoteIdentifier(view.secondaryDataset)}`,
      );
    }
  } finally {
    await Promise.all([
      configSql.end({ timeout: 5 }),
      warehouseSql.end({ timeout: 5 }),
    ]);
  }
};
