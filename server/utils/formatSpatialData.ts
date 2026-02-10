import {
  filterOutUnwantedValues,
  filterGeoData,
} from "@/server/dataProcessing/filterData";
import { getRandomColor } from "@/server/dataProcessing/helpers";

import type { ViewConfig } from "@/types/types";
import type { Feature, FeatureCollection, Geometry } from "geojson";

/**
 * Builds a GeoJSON Feature from a minimal map row (raw DB columns).
 * Assigns filter-color from the filter column value for styling and DataFilter.
 *
 * @param row - One row from fetchMapData (e.g. _id, g__type, g__coordinates, optional styling columns).
 * @param config - View config for this table (used for property keys the client expects).
 * @param resolvedColumns - Resolved SQL column names.
 * @param filterColorMap - Map from filter value to hex color (populated as we iterate).
 * @returns A GeoJSON Feature, or null if geometry is invalid.
 */
export const rowToFeature = (
  row: Record<string, unknown>,
  config: ViewConfig,
  resolvedColumns: {
    colorColumn: string | null;
    iconColumn: string | null;
    filterColumn: string | null;
  },
  filterColorMap: Map<string, string>,
): Feature | null => {
  const gType = row.g__type as string | undefined;
  const gCoords = row.g__coordinates;
  if (!gType || gCoords === undefined || gCoords === null) return null;

  let coordinates: unknown;
  if (typeof gCoords === "string") {
    try {
      coordinates = JSON.parse(gCoords);
    } catch {
      return null;
    }
  } else {
    coordinates = gCoords;
  }

  const properties: Record<string, unknown> = {
    _id: row._id,
  };
  if (
    resolvedColumns.colorColumn &&
    row[resolvedColumns.colorColumn] !== undefined
  ) {
    properties[config.COLOR_COLUMN ?? resolvedColumns.colorColumn] =
      row[resolvedColumns.colorColumn];
  }
  if (
    resolvedColumns.iconColumn &&
    row[resolvedColumns.iconColumn] !== undefined
  ) {
    properties[config.ICON_COLUMN ?? resolvedColumns.iconColumn] =
      row[resolvedColumns.iconColumn];
  }
  const filterValue =
    resolvedColumns.filterColumn != null
      ? String(row[resolvedColumns.filterColumn] ?? "")
      : "";
  if (config.FRONT_END_FILTER_COLUMN !== undefined) {
    properties[config.FRONT_END_FILTER_COLUMN] = filterValue;
  }
  if (!filterColorMap.has(filterValue)) {
    filterColorMap.set(filterValue, getRandomColor());
  }
  properties["filter-color"] = filterColorMap.get(filterValue) ?? "#3333FF";

  const id = row._id;
  return {
    type: "Feature",
    id: typeof id === "number" || typeof id === "string" ? id : String(id),
    geometry: {
      type: gType,
      coordinates,
    } as Geometry,
    properties,
  };
};

/**
 * Converts minimal map rows into a GeoJSON FeatureCollection.
 * Applies geo validation and value-based filtering; does not transform keys/values.
 *
 * @param mapRows - Rows from fetchMapData.
 * @param config - View config for this table.
 * @param resolvedColumns - Resolved SQL column names.
 * @param resolvedFilterByColumn - Resolved SQL column name for FILTER_BY_COLUMN (used for value-based filtering).
 * @param filterOutValues - FILTER_OUT_VALUES_FROM_COLUMN comma-separated.
 * @returns Valid GeoJSON and count for mapStatistics.
 */
export const buildMapFeatureCollection = (
  mapRows: Record<string, unknown>[],
  config: ViewConfig,
  resolvedColumns: {
    colorColumn: string | null;
    iconColumn: string | null;
    filterColumn: string | null;
    filterByColumn: string | null;
  },
  resolvedFilterByColumn: string | null,
  filterOutValues: string | undefined,
): { featureCollection: FeatureCollection; totalFeatures: number } => {
  const filterColorMap = new Map<string, string>();
  const filterByColumn = resolvedFilterByColumn ?? config.FILTER_BY_COLUMN;
  const dataFilteredByValues = filterOutUnwantedValues(
    mapRows as Parameters<typeof filterOutUnwantedValues>[0],
    filterByColumn,
    filterOutValues,
  );
  const filteredGeoData = filterGeoData(
    dataFilteredByValues as Parameters<typeof filterGeoData>[0],
  );
  const features: Feature[] = [];
  for (const row of filteredGeoData) {
    const feature = rowToFeature(
      row as Record<string, unknown>,
      config,
      resolvedColumns,
      filterColorMap,
    );
    if (feature) features.push(feature);
  }
  return {
    featureCollection: { type: "FeatureCollection", features },
    totalFeatures: features.length,
  };
};
