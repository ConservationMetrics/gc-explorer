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
