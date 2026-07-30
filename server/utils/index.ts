import type { BasemapConfig, MapboxStyleConfig, ViewConfig } from "@/types";

import { sql } from "drizzle-orm";

import { warehouseDb } from "@/server/database/dbConnection";
import { fetchTableNames } from "@/server/database/dbOperations";

export type ParsedBasemaps = {
  basemaps: BasemapConfig[];
  defaultMapboxStyle?: MapboxStyleConfig;
};

/**
 * Parse basemaps configuration from ViewConfig for a given table, with legacy fallback.
 */
export const parseBasemaps = (tableConfig: ViewConfig): ParsedBasemaps => {
  let basemaps: BasemapConfig[] = [];
  let defaultMapboxStyle: MapboxStyleConfig | undefined;

  if (tableConfig.MAPBOX_BASEMAPS) {
    try {
      basemaps = JSON.parse(tableConfig.MAPBOX_BASEMAPS as string);
      const defaultBasemap = basemaps.find((b) => b.isDefault);
      if (defaultBasemap) {
        defaultMapboxStyle = defaultBasemap.style;
      } else if (basemaps.length > 0) {
        defaultMapboxStyle = basemaps[0].style;
      }
    } catch {
      // If parsing fails, fall back to legacy MAPBOX_STYLE
      defaultMapboxStyle = tableConfig.MAPBOX_STYLE;
      if (defaultMapboxStyle) {
        basemaps = [
          {
            name: "Default Style",
            style: defaultMapboxStyle,
            isDefault: true,
          },
        ];
      }
    }
  } else if (tableConfig.MAPBOX_STYLE) {
    // Legacy fallback
    defaultMapboxStyle = tableConfig.MAPBOX_STYLE;
    basemaps = [
      {
        name: "Default Style",
        style: defaultMapboxStyle,
        isDefault: true,
      },
    ];
  }

  return { basemaps, defaultMapboxStyle };
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
