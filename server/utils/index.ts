import type { BasemapConfig, ViewConfig, Views } from "@/types";

import { fetchTableNames } from "@/server/database/dbOperations";

export type ParsedBasemaps = {
  basemaps: BasemapConfig[];
  defaultMapboxStyle?: string;
};

/**
 * Returns the config for a table and throws when no view is configured.
 */
export const requireTableViewConfig = (
  viewsConfig: Views,
  table: string,
): ViewConfig => {
  const tableConfig = viewsConfig[table];

  if (!tableConfig || Object.keys(tableConfig).length === 0) {
    const statusMessage = `No view configuration found for table "${table}"`;
    const error = new Error(statusMessage) as Error & {
      statusCode: number;
      statusMessage: string;
    };
    error.statusCode = 404;
    error.statusMessage = statusMessage;
    console.error(error);
    throw error;
  }

  return tableConfig;
};

/**
 * Parse basemaps configuration from ViewConfig for a given table, with legacy fallback.
 */
export const parseBasemaps = (
  viewsConfig: Record<string, ViewConfig>,
  table: string,
): ParsedBasemaps => {
  let basemaps: BasemapConfig[] = [];
  let defaultMapboxStyle: string | undefined;

  const tableConfig = viewsConfig[table] || {};

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
      defaultMapboxStyle = tableConfig.MAPBOX_STYLE as string | undefined;
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
    defaultMapboxStyle = tableConfig.MAPBOX_STYLE as string | undefined;
    basemaps = [
      {
        name: "Default Style",
        style: defaultMapboxStyle as string,
        isDefault: true,
      },
    ];
  }

  return { basemaps, defaultMapboxStyle };
};

/** Retrieves table names from the database, excluding those with metadata, columns, and PostGIS-related entries. */
export const getFilteredTableNames = async () => {
  if (process.env.CI) {
    return ["fake_alerts", "bcmform_responses"];
  }

  let tableNames = await fetchTableNames();
  tableNames = tableNames.filter(
    (name) =>
      !name.includes("metadata") &&
      !name.includes("columns") &&
      !name.includes("spatial_ref_sys"),
  );

  return tableNames;
};
