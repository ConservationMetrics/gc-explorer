import type { BasemapConfig, ParsedBasemaps, ViewConfig } from "@/types";

import { sql } from "drizzle-orm";

import { warehouseDb } from "@/server/database/dbConnection";
import { fetchTableNames } from "@/server/database/dbOperations";

/**
 * Parse MAPBOX_BASEMAPS from a view configuration.
 *
 * @param {ViewConfig} tableConfig - View configuration that may include MAPBOX_BASEMAPS.
 * @returns {ParsedBasemaps} Parsed basemaps plus the default style and access token.
 */
export const parseBasemaps = (tableConfig: ViewConfig): ParsedBasemaps => {
  let basemaps: BasemapConfig[] = [];

  if (tableConfig.MAPBOX_BASEMAPS) {
    try {
      const parsed = JSON.parse(tableConfig.MAPBOX_BASEMAPS) as BasemapConfig[];
      if (Array.isArray(parsed)) {
        basemaps = parsed;
      }
    } catch {
      basemaps = [];
    }
  }

  const defaultBasemap =
    basemaps.find((basemap) => basemap.isDefault) ?? basemaps[0];

  return {
    basemaps,
    defaultMapboxStyle: defaultBasemap?.style,
    defaultAccessToken: defaultBasemap?.access_token,
  };
};

/** Retrieves table names from the database, excluding those with metadata, columns, and PostGIS-related entries. */
export const getFilteredTableNames = async () => {
  let tableNames = await fetchTableNames();
  tableNames = tableNames.filter(
    (name) =>
      !name.includes("metadata") &&
      !name.includes("columns") &&
      !name.includes("spatial_ref_sys"),
  );

  return tableNames;
};

/**
 * Warehouse tables that expose both `g__type` and `g__coordinates` (plottable secondary datasets).
 */
export const getGeospatialTableNames = async (): Promise<string[]> => {
  const tableNames = await getFilteredTableNames();
  if (tableNames.length === 0) return [];

  const rows = await warehouseDb.execute(sql`
    SELECT table_name
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND column_name IN ('g__type', 'g__coordinates')
      AND table_name IN (${sql.join(
        tableNames.map((name) => sql`${name}`),
        sql`, `,
      )})
    GROUP BY table_name
    HAVING COUNT(DISTINCT column_name) = 2
  `);

  const geospatial = new Set(
    rows
      .map(
        (row: unknown) =>
          (row as Record<string, unknown>).table_name as string | undefined,
      )
      .filter((name): name is string => Boolean(name)),
  );

  return tableNames.filter((name) => geospatial.has(name));
};
