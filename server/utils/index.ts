import type { BasemapConfig, ViewConfig } from "@/types";

import { fetchTableNames } from "@/server/database/dbOperations";

export type ParsedBasemaps = {
  basemaps: BasemapConfig[];
  defaultMapboxStyle?: string;
};

/**
 * Parse basemaps configuration from a table ViewConfig, with legacy fallback.
 */
export const parseBasemaps = (tableConfig: ViewConfig): ParsedBasemaps => {
  let basemaps: BasemapConfig[] = [];
  let defaultMapboxStyle: string | undefined;

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
