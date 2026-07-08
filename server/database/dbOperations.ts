import { and, eq, sql } from "drizzle-orm";

import type {
  ColumnEntry,
  DataEntry,
  FetchDataOptions,
  RouteLevelPermission,
  Views,
  ViewConfig,
  ViewConfigRow,
  ViewTables,
  ViewType,
} from "@/types";
import { CONFIG_LIMITS } from "@/utils";

import { viewConfig, publicViews } from "./schema";
import { configDb, warehouseDb } from "./dbConnection";

/**
 * Builds a 404-style error for missing table configuration.
 *
 * @param {string} table - Table name requested by the API route.
 * @returns {Error & { statusCode: number; statusMessage: string }} Error object with HTTP metadata.
 */
const createMissingViewConfigError = (table: string) => {
  const statusMessage = `No view configuration found for table "${table}"`;
  const error = new Error(statusMessage) as Error & {
    statusCode: number;
    statusMessage: string;
  };
  error.statusCode = 404;
  error.statusMessage = statusMessage;
  return error;
};

// Postgres SQLSTATE for a unique-constraint violation.
const PG_UNIQUE_VIOLATION = "23505";

/**
 * True when an error is a Postgres unique-constraint violation (SQLSTATE 23505).
 *
 * @param {unknown} error - The caught error.
 * @returns {boolean} Whether the error is a unique violation.
 */
const isUniqueViolation = (error: unknown): boolean =>
  // `error` is `unknown` (catch clauses always are), so we cannot just read
  // `error.code`. Each clause narrows the type step by step before that access is
  // legal: it must be an object, not null (`typeof null === "object"`), and actually
  // have a `code` property. Only then is reading `code` type-safe.
  typeof error === "object" &&
  error !== null &&
  "code" in error &&
  (error as { code?: unknown }).code === PG_UNIQUE_VIOLATION;

/**
 * Builds a 409-style error for adding a view type a dataset already exposes.
 *
 * @param {string} table - The dataset the view was being added to.
 * @param {ViewType} viewType - The duplicate view type.
 * @returns {Error & { statusCode: number; statusMessage: string }} Error with HTTP metadata.
 */
const createDuplicateViewError = (table: string, viewType: ViewType) => {
  const statusMessage = `A "${viewType}" view already exists for "${table}".`;
  const error = new Error(statusMessage) as Error & {
    statusCode: number;
    statusMessage: string;
  };
  error.statusCode = 409;
  error.statusMessage = statusMessage;
  return error;
};

/**
 * Derives a view's secondary dataset (its Mapeo table) from its config. This is
 * the single source for the `MAPEO_TABLE` → `secondary_dataset` mapping, shared by
 * every place that builds a view row (live writes and the test fixture seed) so the column
 * can never drift from the config field it mirrors: only alerts views have a
 * secondary dataset, and a blank value normalizes to null.
 *
 * TODO(single-source-of-truth): `MAPEO_TABLE` and `secondary_dataset` currently hold
 * the SAME fact in two places — the value stays in the view_config JSON AND is copied
 * into the secondary_dataset column here. They cannot drift (the column is always
 * derived from `MAPEO_TABLE` via this one helper, and nothing writes the column
 * independently), but today the column is effectively a write-only mirror: every
 * reader (alerts.ts, the config edit UI) still reads `MAPEO_TABLE` from the JSON.
 * The follow-up that returns primary/secondary_dataset from the API should make the
 * column the only source: stop persisting `MAPEO_TABLE` in the JSON (strip it like
 * `VIEWS`) and reconstruct it from the column on read for backward compatibility.
 *
 * @param {ViewType} viewType - The view's type.
 * @param {ViewConfig} config - The view's settings JSON.
 * @returns {string | null} The secondary dataset, or null when not applicable.
 */
const deriveSecondaryDataset = (
  viewType: ViewType,
  config: ViewConfig,
): string | null =>
  viewType === "alerts" ? config.MAPEO_TABLE?.trim() || null : null;

/**
 * Checks whether a given table exists in the warehouse schema.
 *
 * @param {string | undefined} table - Table name to verify.
 * @returns {Promise<boolean>} True when the table exists, otherwise false.
 */
const checkTableExists = async (
  table: string | undefined,
): Promise<boolean> => {
  if (!table) return false;

  try {
    const cleanTableName = table.replace(/"/g, "");
    const result = await warehouseDb.execute(sql`
      SELECT to_regclass(${cleanTableName})
    `);
    return (result[0] as { to_regclass: string | null })?.to_regclass !== null;
  } catch (error) {
    console.error("Error checking table existence:", error);
    return false;
  }
};

/**
 * Builds the new single-table view metadata columns from existing config shape.
 *
 * @param {string} primaryDataset - Primary warehouse table for the view.
 * @param {ViewConfig} config - Parsed view config.
 * @param {string} configString - Serialized config JSON.
 * @param {ViewType} viewType - View type for the row.
 * @returns New view metadata column values for views.
 */
export const buildViewConfigColumns = (
  primaryDataset: string,
  config: ViewConfig,
  configString: string,
  viewType: ViewType,
) => {
  // secondaryDataset mirrors config.MAPEO_TABLE; configString still contains
  // MAPEO_TABLE too. See deriveSecondaryDataset's TODO on collapsing to one source.
  const secondaryDataset = deriveSecondaryDataset(viewType, config);

  return {
    // viewName falls back to primaryDataset, but NOTE they are not the same kind of
    // value: DATASET_TABLE is the human display name and primaryDataset is the table
    // IDENTIFIER. This is intentional — view_name is just a display label, so the
    // identifier is a reasonable default when no display name was set. primaryDataset
    // is set from the identifier only and never from DATASET_TABLE.
    viewName: config.DATASET_TABLE?.trim() || primaryDataset,
    viewType,
    primaryDataset,
    secondaryDataset,
    viewConfig: configString,
  };
};

const VALID_COLUMN_NAME = /^[A-Za-z_][A-Za-z0-9_]*$/;

/**
 * Normalizes and validates a projection list before a SQL read is built.
 * Trims names, removes duplicates, rejects empty lists, and enforces safe
 * SQL identifier shape for all projected columns.
 *
 * @param {string[]} columns - Candidate column names for projection.
 * @param {string} contextLabel - Label used in validation error messages.
 * @returns {string[]} Sanitized and deduplicated projection columns.
 */
const normalizeProjectionColumns = (
  columns: string[],
  contextLabel: string,
): string[] => {
  const normalized = Array.from(
    new Set(columns.map((column) => column.trim()).filter(Boolean)),
  );

  if (normalized.length === 0) {
    throw new Error(`Projection for ${contextLabel} cannot be empty`);
  }

  for (const column of normalized) {
    if (!VALID_COLUMN_NAME.test(column)) {
      throw new Error(
        `Invalid column "${column}" in projection for ${contextLabel}`,
      );
    }
  }

  return normalized;
};

/**
 * Fetches rows from a table using an explicit column projection.
 *
 * @param {string | undefined} table - Source table name.
 * @param {string[]} projectionColumns - Columns to include in SELECT.
 * @param {number} [limit] - Optional row limit for the query.
 * @returns {Promise<unknown[]>} Result rows, or an empty array when unavailable.
 */
const fetchDataFromTable = async (
  table: string | undefined,
  projectionColumns: string[],
  limit?: number,
): Promise<unknown[]> => {
  if (!table) return [];

  try {
    const cleanTableName = table.replace(/"/g, "");
    const normalizedProjection = normalizeProjectionColumns(
      projectionColumns,
      cleanTableName,
    );
    const selectedColumns = sql.join(
      normalizedProjection.map((column) => sql.identifier(column)),
      sql`, `,
    );
    const query = limit
      ? sql`SELECT ${selectedColumns} FROM ${sql.identifier(cleanTableName)} LIMIT ${limit}`
      : sql`SELECT ${selectedColumns} FROM ${sql.identifier(cleanTableName)}`;
    const result = await warehouseDb.execute(query);
    return result || [];
  } catch (error) {
    console.error("Error fetching data from table:", error);
    return [];
  }
};

export const DEFAULT_COLUMNS_TABLE_PROJECTION = [
  "original_column",
  "sql_column",
];

export const ALERTS_METADATA_PROJECTION = [
  "data_source",
  "type_alert",
  "month",
  "year",
  "day",
  "total_alerts",
  "description_alerts",
  "territory",
];

/**
 * Resolves SQL column names for a table without using wildcard reads.
 * Prefers `<table>__columns.sql_column` when available, and falls back to
 * `information_schema.columns` in ordinal order.
 *
 * @param {string} table - Base table name.
 * @returns {Promise<string[]>} Ordered list of available SQL column names.
 */
export const fetchTableSqlColumns = async (
  table: string,
): Promise<string[]> => {
  const cleanTableName = table.replace(/"/g, "");
  const columnsTable = `"${cleanTableName}__columns"`;

  if (await checkTableExists(columnsTable)) {
    const columns = (await fetchDataFromTable(columnsTable, [
      "sql_column",
    ])) as Array<{ sql_column?: unknown }>;
    const columnNames = columns
      .map((entry) => entry.sql_column)
      .filter((value): value is string => typeof value === "string");

    if (columnNames.length > 0) {
      return Array.from(new Set(columnNames));
    }
  }

  const schemaColumns = await warehouseDb.execute(sql`
    SELECT column_name
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = ${cleanTableName}
    ORDER BY ordinal_position
  `);

  return Array.from(
    new Set(
      schemaColumns
        .map(
          (row: unknown) =>
            (row as Record<string, unknown>).column_name as string | undefined,
        )
        .filter((column): column is string => Boolean(column)),
    ),
  );
};

/**
 * Fetches projected dataset rows and optional side tables for API routes.
 * Main-table projection is mandatory, while `__columns` and `__metadata`
 * reads are opt-in and require explicit projections.
 *
 * @param {string | undefined} table - Base table name.
 * @param {FetchDataOptions} options - Projection and inclusion settings.
 * @returns {Promise<{ mainData: DataEntry[]; columnsData: ColumnEntry[] | null; metadata: unknown[] | null }>} Projected data payloads.
 */
export const fetchData = async (
  table: string | undefined,
  options: FetchDataOptions,
): Promise<{
  mainData: DataEntry[];
  columnsData: ColumnEntry[] | null;
  metadata: unknown[] | null;
}> => {
  // Performance rule: projection must be pushed down to DB (never SELECT *).
  const mainProjection = normalizeProjectionColumns(
    options.mainColumns,
    `${table ?? "unknown table"} main table`,
  );
  const resolvedLimit =
    options.limit ?? Number(useRuntimeConfig().public.rowLimit as number);

  console.log("Fetching data from", table, "...");
  const mainDataExists = await checkTableExists(table);
  let mainData: DataEntry[] = [];
  if (mainDataExists) {
    mainData = (await fetchDataFromTable(
      table,
      mainProjection,
      resolvedLimit,
    )) as DataEntry[];
  } else {
    throw new Error("Main table does not exist");
  }

  let columnsData = null;
  if (options.includeColumnsData) {
    const columnsProjection = normalizeProjectionColumns(
      options.columnsTableColumns ?? [...DEFAULT_COLUMNS_TABLE_PROJECTION],
      `${table ?? "unknown table"}__columns table`,
    );
    const columnsTable = `"${table}__columns"`;
    const columnsTableExists = await checkTableExists(columnsTable);
    if (columnsTableExists) {
      columnsData = (await fetchDataFromTable(
        columnsTable,
        columnsProjection,
      )) as ColumnEntry[];
    }
  }

  let metadata = null;
  if (options.includeMetadata) {
    const metadataProjection = normalizeProjectionColumns(
      options.metadataColumns ?? [],
      `${table ?? "unknown table"}__metadata table`,
    );
    const metadataTable = `"${table}__metadata"`;
    const metadataTableExists = await checkTableExists(metadataTable);
    if (metadataTableExists) {
      metadata = await fetchDataFromTable(metadataTable, metadataProjection);
    }
  }

  console.log("Successfully fetched data from", table, "!");

  return { mainData, columnsData, metadata };
};

type FetchedViewData = Awaited<ReturnType<typeof fetchData>>;

/**
 * Fetches the warehouse table names configured for one view.
 *
 * @param {string} table - Primary dataset value to match in the views table.
 * @param {ViewType} viewType - View type to resolve.
 * @returns {Promise<ViewTables>} Primary and optional secondary table names.
 * @throws {Error} When the configured view is missing.
 */
export const fetchViewTables = async (
  table: string,
  viewType: ViewType,
): Promise<ViewTables> => {
  const result = await configDb
    .select({
      primaryTable: viewConfig.primaryDataset,
      secondaryTable: viewConfig.secondaryDataset,
    })
    .from(viewConfig)
    .where(
      and(
        eq(viewConfig.viewType, viewType),
        eq(viewConfig.primaryDataset, table),
      ),
    )
    .limit(1);

  if (result.length === 0) {
    throw createMissingViewConfigError(table);
  }

  return {
    primaryTable: result[0].primaryTable,
    secondaryTable: result[0].secondaryTable ?? null,
  };
};

/**
 * Fetches data from a view's primary table and, when configured, secondary table.
 *
 * @param {string} primaryTable - Primary warehouse table name.
 * @param {object} options - Fetch options for primary and optional secondary data.
 * @returns Primary data plus nullable secondary data.
 */
export const fetchViewData = async (
  primaryTable: string,
  {
    secondaryTable,
    primaryOptions,
    secondaryOptions,
  }: {
    secondaryTable?: string | null;
    primaryOptions: FetchDataOptions;
    secondaryOptions?: FetchDataOptions;
  },
): Promise<{
  primaryData: FetchedViewData;
  secondaryData: FetchedViewData | null;
}> => {
  const [primaryData, secondaryData] = await Promise.all([
    fetchData(primaryTable, primaryOptions),
    secondaryTable
      ? fetchData(secondaryTable, secondaryOptions ?? primaryOptions)
      : Promise.resolve(null),
  ]);

  return { primaryData, secondaryData };
};

/**
 * Fetches a single raw record from the warehouse database by its _id column.
 * Returns the record exactly as stored — no transformations or filtering.
 *
 * @param {string} table - The table name to query.
 * @param {string} recordId - The _id value of the record to fetch.
 * @returns {Promise<DataEntry | null>} The raw record, or null if not found.
 */
export const fetchRecord = async (
  table: string,
  recordId: string,
): Promise<DataEntry | null> => {
  const cleanTableName = table.replace(/"/g, "");
  const tableExists = await checkTableExists(cleanTableName);
  if (!tableExists) {
    throw new Error("Table does not exist");
  }

  const result = await warehouseDb.execute(sql`
    SELECT * FROM ${sql.identifier(cleanTableName)} WHERE _id = ${recordId} LIMIT 1
  `);

  if (!result || result.length === 0) {
    return null;
  }

  return result[0] as DataEntry;
};

/**
 * Fetches multiple raw records from the warehouse database by their _id values.
 * Returns records in the same order as the requested IDs; missing IDs are omitted.
 *
 * @param {string} table - The table name to query.
 * @param {string[]} ids - Array of _id values to fetch.
 * @returns {Promise<DataEntry[]>} The matching raw records.
 */
export const fetchRecords = async (
  table: string,
  ids: string[],
): Promise<DataEntry[]> => {
  const tableExists = await checkTableExists(table);
  if (!tableExists) {
    throw new Error("Table does not exist");
  }

  const idPlaceholders = sql.join(
    ids.map((id) => sql`${id}`),
    sql`, `,
  );
  const result = await warehouseDb.execute(sql`
    SELECT * FROM ${sql.identifier(table)}
    WHERE _id IN (${idPlaceholders})
  `);

  return result as Array<DataEntry>;
};

export const fetchTableNames = async (): Promise<string[]> => {
  try {
    const result = await warehouseDb.execute(sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);

    return result.map(
      (row: unknown) => (row as Record<string, unknown>).table_name as string,
    );
  } catch (error) {
    console.error("Error fetching table names:", error);
    return [];
  }
};

export const fetchConfig = async (): Promise<Views> => {
  const viewRows = await fetchViewConfigRows();
  return viewRowsToConfig(viewRows);
};

export const viewRowsToConfig = (rows: ViewConfigRow[]): Views => {
  return rows.reduce((viewsConfig, row) => {
    viewsConfig[row.primaryDataset] = row.viewConfig;
    return viewsConfig;
  }, {} as Views);
};

/**
 * Fetches each configured view as its own row with parsed JSON config.
 *
 * @returns {Promise<ViewConfigRow[]>} View rows used by config management pages.
 */
export const fetchViewConfigRows = async (): Promise<ViewConfigRow[]> => {
  try {
    const result = await configDb.select().from(viewConfig);

    return result.map((row) => ({
      primaryDataset: row.primaryDataset,
      secondaryDataset: row.secondaryDataset,
      viewConfig: JSON.parse(row.viewConfig) as ViewConfig,
      viewId: row.viewId,
      viewName: row.viewName,
      viewType: row.viewType as ViewType,
    }));
  } catch (error) {
    console.error("Error fetching view config rows:", error);
    return [];
  }
};

/**
 * Fetches every configured view for one dataset as its own row.
 *
 * @param {string} primaryDataset - Dataset table whose views are loaded.
 * @returns {Promise<ViewConfigRow[]>} View rows scoped to the dataset.
 */
export const fetchViewConfigRowsForTable = async (
  primaryDataset: string,
): Promise<ViewConfigRow[]> => {
  try {
    const result = await configDb
      .select()
      .from(viewConfig)
      .where(eq(viewConfig.primaryDataset, primaryDataset));

    return result.map((row) => ({
      primaryDataset: row.primaryDataset,
      secondaryDataset: row.secondaryDataset,
      viewConfig: JSON.parse(row.viewConfig) as ViewConfig,
      viewId: row.viewId,
      viewName: row.viewName,
      viewType: row.viewType as ViewType,
    }));
  } catch (error) {
    console.error(
      `Error fetching view config rows for table "${primaryDataset}":`,
      error,
    );
    return [];
  }
};

/**
 * Fetches view configuration for one table only.
 *
 * @param {string} table - Table name to load config for.
 * @param {ViewType} [viewType] - Optional view type to disambiguate multi-view datasets.
 * @returns {Promise<ViewConfig>} Parsed view config for the requested table.
 * @throws {Error} When config is missing or cannot be loaded.
 */
export const fetchTableConfig = async (
  table: string,
  viewType?: ViewType,
): Promise<ViewConfig> => {
  try {
    const result = await configDb
      .select({
        viewConfig: viewConfig.viewConfig,
      })
      .from(viewConfig)
      .where(
        viewType
          ? and(
              eq(viewConfig.primaryDataset, table),
              eq(viewConfig.viewType, viewType),
            )
          : eq(viewConfig.primaryDataset, table),
      )
      // Deterministic pick when a dataset has multiple views and no view type is
      // given: always the oldest view. See follow-up issue on permission semantics.
      .orderBy(viewConfig.viewId)
      .limit(1);

    if (result.length === 0) {
      throw createMissingViewConfigError(table);
    }

    const parsedConfig = JSON.parse(result[0].viewConfig) as ViewConfig;
    if (!parsedConfig || Object.keys(parsedConfig).length === 0) {
      throw createMissingViewConfigError(table);
    }

    return parsedConfig;
  } catch (error) {
    if (error instanceof Error && "statusCode" in error) {
      throw error;
    }
    console.error(`Error fetching config for table "${table}":`, error);
    throw error;
  }
};

/**
 * Keeps public_views in sync with view config: add table if permission is anyone, remove otherwise.
 * @param tableName - The table name to sync.
 * @param permission - The ROUTE_LEVEL_PERMISSION for that table.
 */
export const syncPublicViews = async (
  tableName: string,
  permission: RouteLevelPermission | undefined,
): Promise<void> => {
  if (permission === "anyone") {
    await configDb
      .insert(publicViews)
      .values({ tableName })
      .onConflictDoNothing();
  } else {
    // Ensure table is not in public_views. If it was never there or already removed,
    // delete affects 0 rows and does not throw; save flow continues normally.
    await configDb
      .delete(publicViews)
      .where(eq(publicViews.tableName, tableName));
  }
};

/**
 * Returns the list of table names that are public (ROUTE_LEVEL_PERMISSION = anyone).
 * Used by the open public_views API for middleware auth bypass.
 */
export const fetchPublicViewTableNames = async (): Promise<string[]> => {
  const rows = await configDb
    .select({ tableName: publicViews.tableName })
    .from(publicViews);
  return rows.map((row) => row.tableName);
};

export const updateConfig = async (
  tableName: string,
  config: unknown,
  viewType?: ViewType,
): Promise<void> => {
  try {
    const typedConfig = config as ViewConfig;

    // Validate character limits - check even if field exists as empty string
    if (typedConfig.DATASET_TABLE) {
      const datasetTableValue = String(typedConfig.DATASET_TABLE);
      if (datasetTableValue.length > CONFIG_LIMITS.DATASET_TABLE) {
        throw new Error(
          `DATASET_TABLE must be at most ${CONFIG_LIMITS.DATASET_TABLE} characters (received ${datasetTableValue.length})`,
        );
      }
    }

    if (typedConfig.VIEW_DESCRIPTION) {
      const viewDescriptionValue = String(typedConfig.VIEW_DESCRIPTION);
      if (viewDescriptionValue.length > CONFIG_LIMITS.VIEW_DESCRIPTION) {
        throw new Error(
          `VIEW_DESCRIPTION must be at most ${CONFIG_LIMITS.VIEW_DESCRIPTION} characters (received ${viewDescriptionValue.length})`,
        );
      }
    }

    // A view type is required: a dataset can have several views (e.g. map +
    // gallery), so we must identify exactly one (primary_dataset, view_type) row.
    // Without it we would update every view of the dataset and null their type.
    if (!viewType) {
      throw new Error(
        `updateConfig requires a view type for "${tableName}"; refusing to update without identifying a single view.`,
      );
    }
    const configString = JSON.stringify(typedConfig);
    const viewColumns = buildViewConfigColumns(
      tableName,
      typedConfig,
      configString,
      viewType,
    );

    await configDb
      .update(viewConfig)
      .set(viewColumns)
      .where(
        and(
          eq(viewConfig.primaryDataset, tableName),
          eq(viewConfig.viewType, viewType),
        ),
      );

    await syncPublicViews(tableName, typedConfig.ROUTE_LEVEL_PERMISSION);
  } catch (error) {
    console.error("Error updating config:", error);
    throw error;
  }
};

export const addNewTableToConfig = async (
  tableName: string,
  viewType: ViewType,
): Promise<void> => {
  try {
    const newConfig: ViewConfig = {};
    const configString = JSON.stringify(newConfig);
    await configDb.insert(viewConfig).values({
      ...buildViewConfigColumns(tableName, newConfig, configString, viewType),
    });
  } catch (error) {
    // (view_type, primary_dataset) is unique, so re-adding a view type the dataset
    // already has trips a 23505. Translate it into a clear 409 instead of leaking a
    // raw constraint error as a 500.
    if (isUniqueViolation(error)) {
      throw createDuplicateViewError(tableName, viewType);
    }
    console.error("Error adding new table to config:", error);
    throw error;
  }
};

export const removeTableFromConfig = async (
  tableName: string,
  viewType?: ViewType,
): Promise<void> => {
  try {
    // Delete just the targeted view; without a view type fall back to removing
    // every view of the dataset.
    await configDb
      .delete(viewConfig)
      .where(
        viewType
          ? and(
              eq(viewConfig.primaryDataset, tableName),
              eq(viewConfig.viewType, viewType),
            )
          : eq(viewConfig.primaryDataset, tableName),
      );

    // Only drop the dataset's public_views entry once no views remain for it.
    const remainingViews = await configDb
      .select({ viewId: viewConfig.viewId })
      .from(viewConfig)
      .where(eq(viewConfig.primaryDataset, tableName));
    if (remainingViews.length === 0) {
      await configDb
        .delete(publicViews)
        .where(eq(publicViews.tableName, tableName));
    }
  } catch (error) {
    console.error("Error removing table from config:", error);
    throw error;
  }
};
