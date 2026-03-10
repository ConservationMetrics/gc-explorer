/** Generates a random hex color code. */
import type { BasemapConfig, ViewConfig } from "@/types/types";

export const getRandomColor = () => {
  const letters = "0123456789ABCDEF";
  let color = "#";
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
};

/** Formats a date string to a locale date string. */
export const formatDate = (date: string): string => {
  // First let's ensure the date is in the correct format
  const dateRegex = /(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2}).*/;
  const dateMatch = date.match(dateRegex);
  if (dateMatch) {
    date = new Date(
      `${dateMatch[1]}-${dateMatch[2]}-${dateMatch[3]}T${dateMatch[4]}:${dateMatch[5]}:${dateMatch[6]}`,
    ).toLocaleDateString();
  }
  return date;
};

export type ParsedBasemaps = {
  basemaps: BasemapConfig[];
  defaultMapboxStyle?: string;
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
