import { and, eq, sql } from "drizzle-orm";

import {
  supportsSecondaryDataset,
  type ColumnEntry,
  type CreateViewBody,
  type DataEntry,
  type FetchDataOptions,
  type PublicViewRow,
  type RouteLevelPermission,
  type UpdateViewBody,
  type Views,
  type ViewConfig,
  type ViewConfigRow,
  type ViewTables,
  type ViewType,
} from "@/types";
import { CONFIG_LIMITS } from "@/utils";
import { normalizeTableName } from "@/utils/identifierUtils";
import { validateViewConfigColumns } from "@/utils/viewConfigColumns";

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

const createBadRequestError = (message: string) => {
  const error = new Error(message) as Error & {
    statusCode: number;
    statusMessage: string;
  };
  error.statusCode = 400;
  error.statusMessage = message;
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
  // Postgres errors expose SQLSTATE directly, while DrizzleQueryError wraps
  // the underlying Postgres error in `cause`.
  typeof error === "object" &&
  error !== null &&
  (("code" in error &&
    (error as { code?: unknown }).code === PG_UNIQUE_VIOLATION) ||
    ("cause" in error &&
      typeof error.cause === "object" &&
      error.cause !== null &&
      "code" in error.cause &&
      (error.cause as { code?: unknown }).code === PG_UNIQUE_VIOLATION));

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
    const cleanTableName = normalizeTableName(table);
    // to_regclass expects an identifier string; quote so Unicode / special names resolve.
    const quotedForRegclass = `"${cleanTableName.replace(/"/g, '""')}"`;
    const result = await warehouseDb.execute(sql`
      SELECT to_regclass(${quotedForRegclass})
    `);
    return (result[0] as { to_regclass: string | null })?.to_regclass !== null;
  } catch (error) {
    console.error("Error checking table existence:", error);
    return false;
  }
};

/**
 * Builds the view metadata columns from the submitted config.
 *
 * @param {string} primaryDataset - Primary warehouse table for the view.
 * @param {ViewConfig} config - Parsed view config.
 * @param {ViewType} viewType - View type for the row.
 * @param {string | null} [secondaryDataset] - Optional companion table (map/alerts).
 * @returns New view metadata column values for views.
 */
export const buildViewConfigColumns = (
  primaryDataset: string,
  config: ViewConfig,
  viewType: ViewType,
  secondaryDataset?: string | null,
) => {
  const trimmedSecondary = secondaryDataset?.trim() || null;
  return {
    // viewName falls back to primaryDataset, but NOTE they are not the same kind of
    // value: DATASET_TABLE is the human display name and primaryDataset is the table
    // IDENTIFIER. This is intentional — view_name is just a display label, so the
    // identifier is a reasonable default when no display name was set. primaryDataset
    // is set from the identifier only and never from DATASET_TABLE.
    viewName: config.DATASET_TABLE?.trim() || primaryDataset,
    viewType,
    primaryDataset,
    secondaryDataset: supportsSecondaryDataset(viewType)
      ? trimmedSecondary
      : null,
    viewConfig: JSON.stringify(config),
  };
};

// Unicode letters/digits/marks. sql.identifier quotes these (so leading digits are OK).
const VALID_COLUMN_NAME = /^[\p{L}\p{N}_][\p{L}\p{N}\p{M}_]*$/u;

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
    const cleanTableName = normalizeTableName(table);
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
  const cleanTableName = normalizeTableName(table);
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
 * Reads column names for a warehouse table from information_schema.columns.
 *
 * @param {string} table - Warehouse table name.
 * @returns {Promise<string[]>} SQL column names in ordinal order, without duplicates.
 */
export const fetchInformationSchemaColumns = async (
  table: string,
): Promise<string[]> => {
  const cleanTableName = normalizeTableName(table);

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
 * Resolves original and SQL column names for a warehouse table.
 *
 * @param {string} table - Base table name.
 * @returns {Promise<ColumnEntry[]>} Ordered column names for Config controls.
 */
export const fetchTableColumnEntries = async (
  table: string,
): Promise<ColumnEntry[]> => {
  const cleanTableName = normalizeTableName(table);
  const columnsTable = `"${cleanTableName}__columns"`;

  if (await checkTableExists(columnsTable)) {
    const columns = (await fetchDataFromTable(
      columnsTable,
      DEFAULT_COLUMNS_TABLE_PROJECTION,
    )) as Array<Partial<ColumnEntry>>;
    const entries = columns.filter(
      (column): column is ColumnEntry =>
        typeof column.original_column === "string" &&
        typeof column.sql_column === "string",
    );

    if (entries.length > 0) {
      return entries.filter(
        (column, index) =>
          entries.findIndex(
            (candidate) => candidate.sql_column === column.sql_column,
          ) === index,
      );
    }
  }

  // This helper derives names from information_schema.columns when no usable
  // `<table>__columns` metadata is available.
  const sqlColumns = await fetchTableSqlColumns(cleanTableName);
  return sqlColumns.map((column) => ({
    original_column: column,
    sql_column: column,
  }));
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
  const normalizedTable = table ? normalizeTableName(table) : undefined;
  // Performance rule: projection must be pushed down to DB (never SELECT *).
  const mainProjection = normalizeProjectionColumns(
    options.mainColumns,
    `${normalizedTable ?? "unknown table"} main table`,
  );
  const resolvedLimit =
    options.limit ?? Number(useRuntimeConfig().public.rowLimit as number);

  console.log("Fetching data from", normalizedTable, "...");
  const mainDataExists = await checkTableExists(normalizedTable);
  let mainData: DataEntry[] = [];
  if (mainDataExists) {
    mainData = (await fetchDataFromTable(
      normalizedTable,
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
      `${normalizedTable ?? "unknown table"}__columns table`,
    );
    const columnsTable = `"${normalizedTable}__columns"`;
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
      `${normalizedTable ?? "unknown table"}__metadata table`,
    );
    const metadataTable = `"${normalizedTable}__metadata"`;
    const metadataTableExists = await checkTableExists(metadataTable);
    if (metadataTableExists) {
      metadata = await fetchDataFromTable(metadataTable, metadataProjection);
    }
  }

  console.log("Successfully fetched data from", normalizedTable, "!");

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
  const normalizedTable = normalizeTableName(table);
  const result = await configDb
    .select({
      primaryTable: viewConfig.primaryDataset,
      secondaryTable: viewConfig.secondaryDataset,
    })
    .from(viewConfig)
    .where(
      and(
        eq(viewConfig.viewType, viewType),
        eq(viewConfig.primaryDataset, normalizedTable),
      ),
    )
    .limit(1);

  if (result.length === 0) {
    throw createMissingViewConfigError(normalizedTable);
  }

  return {
    primaryTable: normalizeTableName(result[0].primaryTable),
    secondaryTable: result[0].secondaryTable
      ? normalizeTableName(result[0].secondaryTable)
      : null,
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
  const cleanTableName = normalizeTableName(table);
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
  const cleanTableName = normalizeTableName(table);
  const tableExists = await checkTableExists(cleanTableName);
  if (!tableExists) {
    throw new Error("Table does not exist");
  }

  const idPlaceholders = sql.join(
    ids.map((id) => sql`${id}`),
    sql`, `,
  );
  const result = await warehouseDb.execute(sql`
    SELECT * FROM ${sql.identifier(cleanTableName)}
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
 * Maps one database view row to the public API shape.
 *
 * @param row - Raw row selected from the views table.
 * @returns Parsed view configuration row.
 */
const mapViewConfigRow = (
  row: typeof viewConfig.$inferSelect,
): ViewConfigRow => ({
  primaryDataset: normalizeTableName(row.primaryDataset),
  secondaryDataset: row.secondaryDataset
    ? normalizeTableName(row.secondaryDataset)
    : row.secondaryDataset,
  viewConfig: JSON.parse(row.viewConfig) as ViewConfig,
  viewId: row.viewId,
  viewName: row.viewName,
  viewType: row.viewType as ViewType,
});

/**
 * Fetches each configured view as its own row with parsed JSON config.
 *
 * @param {string} [primaryDataset] - Optional primary dataset filter.
 * @returns {Promise<ViewConfigRow[]>} View rows used by config management pages.
 */
export const fetchViewConfigRows = async (
  primaryDataset?: string,
): Promise<ViewConfigRow[]> => {
  try {
    const normalizedDataset = primaryDataset
      ? normalizeTableName(primaryDataset)
      : undefined;
    const query = configDb.select().from(viewConfig).$dynamic();
    const result = normalizedDataset
      ? await query.where(eq(viewConfig.primaryDataset, normalizedDataset))
      : await query;

    return result.map(mapViewConfigRow);
  } catch (error) {
    console.error("Error fetching view config rows:", error);
    throw error;
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
): Promise<ViewConfigRow[]> => fetchViewConfigRows(primaryDataset);

/**
 * Fetches one configured view by its stable ID.
 *
 * @param {number} viewId - Stable view row ID.
 * @returns {Promise<ViewConfigRow>} Matching view row.
 */
export const fetchViewConfigRow = async (
  viewId: number,
): Promise<ViewConfigRow> => {
  const result = await configDb
    .select()
    .from(viewConfig)
    .where(eq(viewConfig.viewId, viewId))
    .limit(1);

  if (result.length === 0) {
    const statusMessage = `View ${viewId} was not found`;
    throw Object.assign(new Error(statusMessage), {
      statusCode: 404,
      statusMessage,
    });
  }

  return mapViewConfigRow(result[0]);
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
  const normalizedTable = normalizeTableName(table);
  try {
    const result = await configDb
      .select({
        viewConfig: viewConfig.viewConfig,
      })
      .from(viewConfig)
      .where(
        viewType
          ? and(
              eq(viewConfig.primaryDataset, normalizedTable),
              eq(viewConfig.viewType, viewType),
            )
          : eq(viewConfig.primaryDataset, normalizedTable),
      )
      // Deterministic pick when a dataset has multiple views and no view type is
      // given: always the oldest view. See follow-up issue on permission semantics.
      .orderBy(viewConfig.viewId)
      .limit(1);

    if (result.length === 0) {
      throw createMissingViewConfigError(normalizedTable);
    }

    const parsedConfig = JSON.parse(result[0].viewConfig) as ViewConfig;
    if (!parsedConfig || Object.keys(parsedConfig).length === 0) {
      throw createMissingViewConfigError(normalizedTable);
    }

    return parsedConfig;
  } catch (error) {
    if (error instanceof Error && "statusCode" in error) {
      throw error;
    }
    console.error(
      `Error fetching config for table "${normalizedTable}":`,
      error,
    );
    throw error;
  }
};

/**
 * Returns the view config for a dataset read.
 *
 * View configs are keyed by primary dataset and view type. A secondary dataset
 * request therefore includes both, and must match the configured secondary
 * dataset before using that config.
 *
 * @param {string} requestedDataset - Warehouse dataset being read.
 * @param {{ viewType?: ViewType; primaryDataset?: string | null }} [options] - View identity.
 * @returns {Promise<ViewConfig>} Config for the requested dataset's view.
 */
export const fetchViewConfigForDatasetRead = async (
  requestedDataset: string,
  options: {
    viewType?: ViewType;
    primaryDataset?: string | null;
  } = {},
): Promise<ViewConfig> => {
  const normalizedRequestedDataset = normalizeTableName(requestedDataset);
  const primaryDataset = options.primaryDataset?.trim()
    ? normalizeTableName(options.primaryDataset)
    : null;

  if (!primaryDataset) {
    return fetchTableConfig(normalizedRequestedDataset, options.viewType);
  }

  if (!options.viewType) {
    throw Object.assign(
      new Error("view_type is required when primary_dataset is set"),
      {
        statusCode: 400,
        statusMessage: "view_type is required when primary_dataset is set",
      },
    );
  }

  const { secondaryTable: secondaryDataset } = await fetchViewTables(
    primaryDataset,
    options.viewType,
  );

  if (secondaryDataset !== normalizedRequestedDataset) {
    throw Object.assign(
      new Error(
        `Dataset "${normalizedRequestedDataset}" is not the secondary dataset for view (${primaryDataset}, ${options.viewType})`,
      ),
      {
        statusCode: 403,
        statusMessage: `Dataset "${normalizedRequestedDataset}" is not the configured secondary dataset`,
      },
    );
  }

  return fetchTableConfig(primaryDataset, options.viewType);
};

/**
 * Keeps public_views in sync with one view's permission.
 *
 * @param viewId - View row to synchronize.
 * @param permission - Current route-level permission.
 * @returns {Promise<void>}
 */
export const syncPublicViews = async (
  viewId: number,
  permission: RouteLevelPermission | undefined,
): Promise<void> => {
  if (permission === "anyone") {
    await configDb.insert(publicViews).values({ viewId }).onConflictDoNothing();
  } else {
    await configDb.delete(publicViews).where(eq(publicViews.viewId, viewId));
  }
};

/**
 * Returns stable identities for views that allow public access.
 *
 * @returns {Promise<PublicViewRow[]>} Public view descriptors.
 */
export const fetchPublicViews = async (): Promise<PublicViewRow[]> => {
  const rows = await configDb
    .select({
      primaryDataset: viewConfig.primaryDataset,
      viewId: viewConfig.viewId,
      viewType: viewConfig.viewType,
    })
    .from(publicViews)
    .innerJoin(viewConfig, eq(publicViews.viewId, viewConfig.viewId));

  return rows.map((row) => ({
    primaryDataset: normalizeTableName(row.primaryDataset),
    viewId: row.viewId,
    viewType: row.viewType as ViewType,
  }));
};

/**
 * Rejects missing, protected, or conflicting column references in a view config.
 *
 * @param {string} primaryDataset - Primary warehouse table.
 * @param {ViewConfig} config - View configuration to validate.
 * @param {ViewType} viewType - View type being saved.
 * @param {string | null | undefined} secondaryDataset - Optional secondary table.
 * @returns {Promise<void>}
 */
const assertValidViewConfigColumns = async (
  primaryDataset: string,
  config: ViewConfig,
  viewType: ViewType,
  secondaryDataset?: string | null,
): Promise<void> => {
  const hasSecondaryDataset = Boolean(secondaryDataset);
  const [primaryColumns, secondaryColumns] = await Promise.all([
    fetchTableColumnEntries(primaryDataset),
    viewType === "alerts" && secondaryDataset
      ? fetchTableColumnEntries(secondaryDataset)
      : Promise.resolve([]),
  ]);
  const validation = validateViewConfigColumns(
    config,
    primaryColumns,
    secondaryColumns,
    viewType,
    hasSecondaryDataset,
  );

  if (validation.isValid) return;

  const details = [
    ...Object.entries(validation.invalidSelections).map(
      ([key, column]) => `${key} references unavailable column "${column}"`,
    ),
  ];

  throw createBadRequestError(details.join("; "));
};

/**
 * Validates text limits enforced by the configuration form.
 *
 * @param config - View configuration to validate.
 * @returns {void}
 */
const assertViewConfigTextLimits = (config: ViewConfig): void => {
  if (
    config.DATASET_TABLE &&
    config.DATASET_TABLE.length > CONFIG_LIMITS.DATASET_TABLE
  ) {
    throw createBadRequestError(
      `DATASET_TABLE must be at most ${CONFIG_LIMITS.DATASET_TABLE} characters (received ${config.DATASET_TABLE.length})`,
    );
  }

  if (
    config.VIEW_DESCRIPTION &&
    config.VIEW_DESCRIPTION.length > CONFIG_LIMITS.VIEW_DESCRIPTION
  ) {
    throw createBadRequestError(
      `VIEW_DESCRIPTION must be at most ${CONFIG_LIMITS.VIEW_DESCRIPTION} characters (received ${config.VIEW_DESCRIPTION.length})`,
    );
  }
};

export const updateConfig = async (
  tableName: string,
  config: unknown,
  viewType?: ViewType,
  secondaryDataset?: string | null,
): Promise<void> => {
  try {
    const normalizedTable = normalizeTableName(tableName);
    const normalizedSecondary =
      secondaryDataset != null && secondaryDataset !== ""
        ? normalizeTableName(secondaryDataset)
        : secondaryDataset;
    const typedConfig = config as ViewConfig;

    assertViewConfigTextLimits(typedConfig);

    // A view type is required: a dataset can have several views (e.g. map +
    // gallery), so we must identify exactly one (primary_dataset, view_type) row.
    // Without it we would update every view of the dataset and null their type.
    if (!viewType) {
      throw new Error(
        `updateConfig requires a view type for "${normalizedTable}"; refusing to update without identifying a single view.`,
      );
    }
    await assertValidViewConfigColumns(
      normalizedTable,
      typedConfig,
      viewType,
      normalizedSecondary,
    );
    const viewColumns = buildViewConfigColumns(
      normalizedTable,
      typedConfig,
      viewType,
      normalizedSecondary,
    );

    const updatedRows = await configDb
      .update(viewConfig)
      .set(viewColumns)
      .where(
        and(
          eq(viewConfig.primaryDataset, normalizedTable),
          eq(viewConfig.viewType, viewType),
        ),
      )
      .returning({ viewId: viewConfig.viewId });

    if (updatedRows.length === 0) {
      throw createMissingViewConfigError(normalizedTable);
    }
    await syncPublicViews(
      updatedRows[0].viewId,
      typedConfig.ROUTE_LEVEL_PERMISSION,
    );
  } catch (error) {
    console.error("Error updating config:", error);
    throw error;
  }
};

/**
 * Inserts a new views row for (viewType, primaryDataset).
 *
 * @param {string} tableName - Primary warehouse table.
 * @param {ViewType} viewType - View type to create.
 * @param {ViewConfig} [config] - Optional config from the create form; defaults otherwise.
 * @param {string | null} [secondaryDataset] - Optional alerts companion table.
 * @returns {Promise<void>}
 */
export const addNewTableToConfig = async (
  tableName: string,
  viewType: ViewType,
  config?: ViewConfig,
  secondaryDataset?: string | null,
): Promise<void> => {
  const normalizedTable = normalizeTableName(tableName);
  const normalizedSecondary =
    secondaryDataset != null && secondaryDataset !== ""
      ? normalizeTableName(secondaryDataset)
      : secondaryDataset;
  try {
    await assertValidViewConfigColumns(
      normalizedTable,
      config ?? {},
      viewType,
      normalizedSecondary,
    );
    const insertedRows = await configDb
      .insert(viewConfig)
      .values({
        ...buildViewConfigColumns(
          normalizedTable,
          config ?? {},
          viewType,
          normalizedSecondary,
        ),
      })
      .returning({ viewId: viewConfig.viewId });
    await syncPublicViews(
      insertedRows[0].viewId,
      config?.ROUTE_LEVEL_PERMISSION,
    );
  } catch (error) {
    // (view_type, primary_dataset) is unique, so re-adding a view type the dataset
    // already has trips a 23505. Translate it into a clear 409 instead of leaking a
    // raw constraint error as a 500.
    if (isUniqueViolation(error)) {
      throw createDuplicateViewError(normalizedTable, viewType);
    }
    console.error("Error adding new table to config:", error);
    throw error;
  }
};

/**
 * Deletes the view config row for the given primary dataset and view type.
 *
 * @param {string} tableName - Primary dataset / table name.
 * @param {ViewType} viewType - View type whose config row to delete.
 * @returns {Promise<void>}
 */
export const removeTableFromConfig = async (
  tableName: string,
  viewType: ViewType,
): Promise<void> => {
  const normalizedTable = normalizeTableName(tableName);
  try {
    await configDb
      .delete(viewConfig)
      .where(
        and(
          eq(viewConfig.primaryDataset, normalizedTable),
          eq(viewConfig.viewType, viewType),
        ),
      );
  } catch (error) {
    console.error("Error removing table from config:", error);
    throw error;
  }
};

/**
 * Creates one view resource and returns its stable identity.
 *
 * @param input - New view fields.
 * @returns {Promise<ViewConfigRow>} Created view row.
 */
export const createView = async (
  input: CreateViewBody,
): Promise<ViewConfigRow> => {
  const normalizedTable = normalizeTableName(input.primaryDataset);
  const normalizedSecondary =
    input.secondaryDataset != null && input.secondaryDataset !== ""
      ? normalizeTableName(input.secondaryDataset)
      : input.secondaryDataset;
  const config = input.viewConfig ?? {};

  try {
    assertViewConfigTextLimits(config);
    await assertValidViewConfigColumns(
      normalizedTable,
      config,
      input.viewType,
      normalizedSecondary,
    );
    const result = await configDb
      .insert(viewConfig)
      .values(
        buildViewConfigColumns(
          normalizedTable,
          config,
          input.viewType,
          normalizedSecondary,
        ),
      )
      .returning();
    const createdView = mapViewConfigRow(result[0]);
    await syncPublicViews(
      createdView.viewId,
      createdView.viewConfig.ROUTE_LEVEL_PERMISSION,
    );
    return createdView;
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw createDuplicateViewError(normalizedTable, input.viewType);
    }
    console.error("Error creating view:", error);
    throw error;
  }
};

/**
 * Updates one view resource by stable ID.
 *
 * @param viewId - View row to update.
 * @param input - Mutable view fields.
 * @returns {Promise<ViewConfigRow>} Updated view row.
 */
export const updateView = async (
  viewId: number,
  input: UpdateViewBody,
): Promise<ViewConfigRow> => {
  const existingView = await fetchViewConfigRow(viewId);
  const secondaryDataset =
    input.secondaryDataset === undefined
      ? existingView.secondaryDataset
      : input.secondaryDataset;
  const normalizedSecondary =
    secondaryDataset != null && secondaryDataset !== ""
      ? normalizeTableName(secondaryDataset)
      : secondaryDataset;

  assertViewConfigTextLimits(input.viewConfig);
  await assertValidViewConfigColumns(
    existingView.primaryDataset,
    input.viewConfig,
    existingView.viewType,
    normalizedSecondary,
  );

  const result = await configDb
    .update(viewConfig)
    .set(
      buildViewConfigColumns(
        existingView.primaryDataset,
        input.viewConfig,
        existingView.viewType,
        normalizedSecondary,
      ),
    )
    .where(eq(viewConfig.viewId, viewId))
    .returning();
  const updatedView = mapViewConfigRow(result[0]);
  await syncPublicViews(
    updatedView.viewId,
    updatedView.viewConfig.ROUTE_LEVEL_PERMISSION,
  );
  return updatedView;
};

/**
 * Deletes one view resource by stable ID.
 *
 * @param viewId - View row to delete.
 * @returns {Promise<void>}
 */
export const deleteView = async (viewId: number): Promise<void> => {
  await fetchViewConfigRow(viewId);
  await configDb.delete(viewConfig).where(eq(viewConfig.viewId, viewId));
};
