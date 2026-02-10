import { eq, sql } from "drizzle-orm";

import type { ColumnEntry, DataEntry, Views, ViewConfig } from "@/types/types";
import { CONFIG_LIMITS } from "@/utils";

import { viewConfig } from "../db/schema";
import { configDb, warehouseDb } from "../utils/db";

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

const fetchDataFromTable = async (
  table: string | undefined,
): Promise<unknown[]> => {
  if (!table) return [];

  try {
    const cleanTableName = table.replace(/"/g, "");
    const result = await warehouseDb.execute(sql`
      SELECT * FROM ${sql.identifier(cleanTableName)}
    `);
    return result || [];
  } catch (error) {
    console.error("Error fetching data from table:", error);
    return [];
  }
};

/**
 * Returns the set of column names for a warehouse table from information_schema.
 * Used to build minimal SELECT lists (e.g. for map view) and avoid selecting missing columns.
 *
 * @param {string | undefined} table - The warehouse table name (unquoted).
 * @returns {Promise<Set<string>>} Set of column names in the table.
 */
const getTableColumnNames = async (
  table: string | undefined,
): Promise<Set<string>> => {
  if (!table) return new Set();
  try {
    const cleanTableName = table.replace(/"/g, "");
    const result = await warehouseDb.execute(sql`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = ${cleanTableName}
    `);
    return new Set(
      (result as unknown as { column_name: string }[]).map(
        (row) => row.column_name,
      ),
    );
  } catch (error) {
    console.error("Error fetching table column names:", error);
    return new Set();
  }
};

/**
 * Resolves a config column name to the actual SQL column name for the warehouse table.
 * If the config value is already a table column, returns it; otherwise looks up via
 * the table's __columns mapping (original_column -> sql_column).
 *
 * @param {string | undefined} configColumnName - Value from view config (e.g. COLOR_COLUMN).
 * @param {ColumnEntry[] | null} columnsData - Rows from the table's __columns mapping.
 * @param {Set<string>} tableColumnNames - Valid column names in the warehouse table.
 * @returns {string | null} SQL column name to use, or null if not found.
 */
const resolveMapColumn = (
  configColumnName: string | undefined,
  columnsData: ColumnEntry[] | null,
  tableColumnNames: Set<string>,
): string | null => {
  if (!configColumnName) return null;
  if (tableColumnNames.has(configColumnName)) return configColumnName;
  if (columnsData) {
    const byOriginal = columnsData.find(
      (c) => c.original_column === configColumnName,
    );
    if (byOriginal && tableColumnNames.has(byOriginal.sql_column)) {
      return byOriginal.sql_column;
    }
    const bySql = columnsData.find((c) => c.sql_column === configColumnName);
    if (bySql && tableColumnNames.has(bySql.sql_column))
      return bySql.sql_column;
  }
  return null;
};

/** Resolved SQL column names for map styling and filtering. */
export type MapResolvedColumns = {
  colorColumn: string | null;
  iconColumn: string | null;
  filterColumn: string | null;
  filterByColumn: string | null;
};

/**
 * Fetches only the minimal columns needed for the map view: _id, geometry fields,
 * and optional styling/filter columns from config. Reduces payload and DB load vs fetchData.
 *
 * @param {string | undefined} table - The warehouse table name.
 * @param {ViewConfig} config - View config for this table (COLOR_COLUMN, ICON_COLUMN, FRONT_END_FILTER_COLUMN, etc.).
 * @returns {Promise<{ mapRows: DataEntry[]; columnsData: ColumnEntry[] | null; resolvedColumns: MapResolvedColumns }>} Map rows, column metadata, and resolved SQL column names for styling/filter.
 * @throws {Error} If the main table does not exist.
 */
export const fetchMapData = async (
  table: string | undefined,
  config: ViewConfig,
): Promise<{
  mapRows: DataEntry[];
  columnsData: ColumnEntry[] | null;
  resolvedColumns: MapResolvedColumns;
}> => {
  if (!table) {
    throw new Error("Table name is required");
  }
  const mainDataExists = await checkTableExists(table);
  if (!mainDataExists) {
    throw new Error("Main table does not exist");
  }

  const tableColumnNames = await getTableColumnNames(table);
  const required = ["_id", "g__type", "g__coordinates"];
  for (const col of required) {
    if (!tableColumnNames.has(col)) {
      throw new Error(`Main table is missing required column for map: ${col}`);
    }
  }

  const columnsTable = `"${table}__columns"`;
  const columnsTableExists = await checkTableExists(columnsTable);
  let columnsData: ColumnEntry[] | null = null;
  if (columnsTableExists) {
    columnsData = (await fetchDataFromTable(columnsTable)) as ColumnEntry[];
  }

  const selectColumns: string[] = [...required];
  const optionalConfigColumns = [
    config.COLOR_COLUMN,
    config.ICON_COLUMN,
    config.FRONT_END_FILTER_COLUMN,
    config.FILTER_BY_COLUMN,
  ].filter(Boolean) as string[];
  for (const configCol of optionalConfigColumns) {
    const resolved = resolveMapColumn(configCol, columnsData, tableColumnNames);
    if (resolved && !selectColumns.includes(resolved)) {
      selectColumns.push(resolved);
    }
  }

  const cleanTableName = table.replace(/"/g, "");
  const identifiers = selectColumns.map((c) => sql.identifier(c));
  const selectList = sql.join(identifiers, sql`, `);
  const result = await warehouseDb.execute(sql`
    SELECT ${selectList} FROM ${sql.identifier(cleanTableName)}
  `);
  const mapRows = (result || []) as DataEntry[];

  const resolvedColumns = {
    colorColumn: resolveMapColumn(
      config.COLOR_COLUMN,
      columnsData,
      tableColumnNames,
    ),
    iconColumn: resolveMapColumn(
      config.ICON_COLUMN,
      columnsData,
      tableColumnNames,
    ),
    filterColumn: resolveMapColumn(
      config.FRONT_END_FILTER_COLUMN,
      columnsData,
      tableColumnNames,
    ),
    filterByColumn: resolveMapColumn(
      config.FILTER_BY_COLUMN,
      columnsData,
      tableColumnNames,
    ),
  };

  return { mapRows, columnsData, resolvedColumns };
};

/**
 * Fetches a single raw record by _id from a warehouse table.
 * Used for on-demand full record load (e.g. when a user clicks a map feature).
 *
 * @param {string | undefined} table - The warehouse table name.
 * @param {string} recordId - The value of the _id column for the record.
 * @returns {Promise<DataEntry | null>} The raw row as an object, or null if not found.
 * @throws {Error} If the table does not exist.
 */
export const fetchRecordById = async (
  table: string | undefined,
  recordId: string,
): Promise<DataEntry | null> => {
  if (!table || !recordId) return null;
  const tableExists = await checkTableExists(table);
  if (!tableExists) {
    throw new Error("Main table does not exist");
  }
  const cleanTableName = table.replace(/"/g, "");
  const result = await warehouseDb.execute(sql`
    SELECT * FROM ${sql.identifier(cleanTableName)} WHERE _id = ${recordId} LIMIT 1
  `);
  const row = (result as DataEntry[])?.[0];
  return row ?? null;
};

/** Max number of IDs allowed in a single bulk records request. */
export const BULK_RECORDS_MAX_IDS = 100;

/**
 * Fetches raw records by _id from a warehouse table. Returns results in the same order as the requested ids; missing records are omitted (or we could use null placeholders - AC says "preserves request order or explicit mapping". We preserve order and use null for missing).
 *
 * @param table - The warehouse table name.
 * @param ids - Array of _id values to fetch.
 * @returns Array of raw rows in request order; null for missing ids.
 * @throws If table does not exist or ids length exceeds BULK_RECORDS_MAX_IDS.
 */
export const fetchRecordsByIds = async (
  table: string | undefined,
  ids: string[],
): Promise<(DataEntry | null)[]> => {
  if (!table) throw new Error("Table name is required");
  if (ids.length > BULK_RECORDS_MAX_IDS)
    throw new Error(
      `Too many IDs: ${ids.length} exceeds maximum ${BULK_RECORDS_MAX_IDS}`,
    );
  const tableExists = await checkTableExists(table);
  if (!tableExists) throw new Error("Main table does not exist");
  if (ids.length === 0) return [];

  const cleanTableName = table.replace(/"/g, "");
  const uniqueIds = [...new Set(ids)];
  const inList = sql.join(
    uniqueIds.map((id) => sql`${id}`),
    sql`, `,
  );
  const result = await warehouseDb.execute(sql`
    SELECT * FROM ${sql.identifier(cleanTableName)}
    WHERE _id IN (${inList})
  `);
  const rows = (result || []) as DataEntry[];
  const byId = new Map<string, DataEntry>();
  for (const row of rows) {
    const id =
      row._id != null ? String(row._id) : row.id != null ? String(row.id) : "";
    if (id) byId.set(id, row);
  }
  return ids.map((id) => byId.get(id) ?? null);
};

export const fetchData = async (
  table: string | undefined,
): Promise<{
  mainData: DataEntry[];
  columnsData: ColumnEntry[] | null;
  metadata: unknown[] | null;
}> => {
  console.log("Fetching data from", table, "...");
  const mainDataExists = await checkTableExists(table);
  let mainData: DataEntry[] = [];
  if (mainDataExists) {
    mainData = (await fetchDataFromTable(table)) as DataEntry[];
  } else {
    throw new Error("Main table does not exist");
  }

  // Fetch mapping columns
  const columnsTable = `"${table}__columns"`;
  const columnsTableExists = await checkTableExists(columnsTable);
  let columnsData = null;
  if (columnsTableExists) {
    columnsData = (await fetchDataFromTable(columnsTable)) as ColumnEntry[];
  }

  // Fetch metadata
  const metadataTable = `"${table}__metadata"`;
  const metadataTableExists = await checkTableExists(metadataTable);
  let metadata = null;
  if (metadataTableExists) {
    metadata = await fetchDataFromTable(metadataTable);
  }

  console.log("Successfully fetched data from", table, "!");

  return { mainData, columnsData, metadata };
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
  // If running in CI, return hardcoded configuration for testing purposes
  if (process.env.CI) {
    const mapboxAccessToken =
      process.env.MAPBOX_ACCESS_TOKEN || "{MAPBOX_ACCESS_TOKEN}";
    const mediaBasePath = process.env.MEDIA_BASE_PATH || "{MEDIA_BASE_PATH}";
    const planetApiKey = process.env.PLANET_API_KEY || "{PLANET_API_KEY}";

    return {
      seed_survey_data: {
        VIEWS: "gallery",
        MAPBOX_STYLE: "mapbox://styles/mapbox/streets-v12",
        MAPBOX_ACCESS_TOKEN: mapboxAccessToken,
        MAPBOX_ZOOM: 16,
        MAPBOX_CENTER_LATITUDE: "3.44704",
        MAPBOX_CENTER_LONGITUDE: "-76.53995",
        MAPBOX_PROJECTION: "globe",
        MAPBOX_BEARING: 0,
        MAPBOX_PITCH: 0,
        FRONT_END_FILTER_COLUMN: "community",
        MEDIA_BASE_PATH: mediaBasePath,
        ROUTE_LEVEL_PERMISSION: "anyone",
        DATASET_TABLE: undefined,
        VIEW_HEADER_IMAGE: undefined,
        VIEW_DESCRIPTION: undefined,
      },
      bcmform_responses: {
        VIEWS: "map,gallery",
        MAPBOX_STYLE: "mapbox://styles/mapbox/streets-v12",
        MAPBOX_ACCESS_TOKEN: mapboxAccessToken,
        MAPBOX_ZOOM: 16,
        MAPBOX_CENTER_LATITUDE: "3.44704",
        MAPBOX_CENTER_LONGITUDE: "-76.53995",
        MAPBOX_PROJECTION: "globe",
        MAPBOX_BEARING: 0,
        MAPBOX_PITCH: 0,
        FRONT_END_FILTER_COLUMN: "community",
        MEDIA_BASE_PATH: mediaBasePath,
        ROUTE_LEVEL_PERMISSION: "member",
        DATASET_TABLE: undefined,
        VIEW_HEADER_IMAGE: undefined,
        VIEW_DESCRIPTION: undefined,
      },
      fake_alerts: {
        VIEWS: "alerts",
        EMBED_MEDIA: "YES",
        MEDIA_BASE_PATH_ALERTS: "",
        MEDIA_BASE_PATH: "",
        LOGO_URL:
          "https://conservationmetrics.com/wp-content/themes/conservation-metrics/images/logo-conservation-metrics.png",
        MAPBOX_STYLE: "mapbox://styles/mapbox/satellite-streets-v12",
        MAPBOX_PROJECTION: "globe",
        MAPBOX_CENTER_LATITUDE: "38",
        MAPBOX_CENTER_LONGITUDE: "-79",
        MAPBOX_ZOOM: 7,
        MAPBOX_PITCH: 0,
        MAPBOX_BEARING: 0,
        MAPBOX_3D: false,
        MAPEO_TABLE: "mapeo_data",
        MAPEO_CATEGORY_IDS: "threat",
        MAP_LEGEND_LAYER_IDS: "road-primary,aerialway",
        ALERT_RESOURCES: "NO",
        MAPBOX_ACCESS_TOKEN: mapboxAccessToken,
        PLANET_API_KEY: planetApiKey,
        ROUTE_LEVEL_PERMISSION: "anyone",
        DATASET_TABLE: undefined,
        VIEW_HEADER_IMAGE: undefined,
        VIEW_DESCRIPTION: undefined,
      },
    };
  }

  try {
    // Check if view_config table exists in config database, create if it doesn't
    const tableExistsResult = await configDb.execute(sql`
      SELECT to_regclass('view_config')
    `);
    const tableExists =
      (tableExistsResult[0] as { to_regclass: string | null })?.to_regclass !==
      null;

    if (!tableExists) {
      await configDb.execute(sql`
        CREATE TABLE view_config (
          table_name TEXT PRIMARY KEY,
          views_config TEXT
        )
      `);
    }

    const result = await configDb.select().from(viewConfig);

    const viewsConfig: Views = {};
    result.forEach((row) => {
      viewsConfig[row.tableName] = JSON.parse(row.viewsConfig);
    });

    return viewsConfig;
  } catch (error) {
    console.error("Error fetching config:", error);
    return {};
  }
};

export const updateConfig = async (
  tableName: string,
  config: unknown,
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

    const configString = JSON.stringify(config);

    await configDb
      .update(viewConfig)
      .set({
        viewsConfig: configString,
      })
      .where(eq(viewConfig.tableName, tableName));
  } catch (error) {
    console.error("Error updating config:", error);
    throw error;
  }
};

export const addNewTableToConfig = async (tableName: string): Promise<void> => {
  try {
    await configDb.insert(viewConfig).values({
      tableName,
      viewsConfig: "{}",
    });
  } catch (error) {
    console.error("Error adding new table to config:", error);
    throw error;
  }
};

export const removeTableFromConfig = async (
  tableName: string,
): Promise<void> => {
  try {
    await configDb
      .delete(viewConfig)
      .where(eq(viewConfig.tableName, tableName));
  } catch (error) {
    console.error("Error removing table from config:", error);
    throw error;
  }
};
