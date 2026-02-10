import { fetchConfig, fetchMapData } from "@/server/database/dbOperations";
import {
  filterOutUnwantedValues,
  filterGeoData,
} from "@/server/dataProcessing/filterData";
import { getRandomColor } from "@/utils/dataProcessing/helpers";
import { validatePermissions } from "@/utils/auth";
import { parseBasemaps } from "@/server/utils/basemaps";

import type { H3Event } from "h3";
import type { AllowedFileExtensions, ViewConfig } from "@/types/types";
import type { Feature, FeatureCollection, Geometry } from "geojson";

/**
 * Builds a GeoJSON Feature from a minimal map row (raw DB columns).
 * Assigns filter-color from the filter column value for styling and DataFilter.
 *
 * @param {Record<string, unknown>} row - One row from fetchMapData (e.g. _id, g__type, g__coordinates, optional styling columns).
 * @param {ViewConfig} config - View config for this table (used for property keys the client expects).
 * @param {{ colorColumn: string | null; iconColumn: string | null; filterColumn: string | null }} resolvedColumns - Resolved SQL column names.
 * @param {Map<string, string>} filterColorMap - Map from filter value to hex color (populated as we iterate).
 * @returns {Feature | null} A GeoJSON Feature, or null if geometry is invalid.
 */
function rowToFeature(
  row: Record<string, unknown>,
  config: ViewConfig,
  resolvedColumns: {
    colorColumn: string | null;
    iconColumn: string | null;
    filterColumn: string | null;
  },
  filterColorMap: Map<string, string>,
): Feature | null {
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
}

/**
 * Converts minimal map rows into a GeoJSON FeatureCollection.
 * Applies geo validation and value-based filtering; does not transform keys/values.
 *
 * @param {Record<string, unknown>[]} mapRows - Rows from fetchMapData.
 * @param {ViewConfig} config - View config for this table.
 * @param {{ colorColumn: string | null; iconColumn: string | null; filterColumn: string | null }} resolvedColumns - Resolved SQL column names.
 * @param {string | null} resolvedFilterByColumn - Resolved SQL column name for FILTER_BY_COLUMN (used for value-based filtering).
 * @param {string | undefined} filterOutValues - FILTER_OUT_VALUES_FROM_COLUMN comma-separated.
 * @returns {{ featureCollection: FeatureCollection; totalFeatures: number }} Valid GeoJSON and count for mapStatistics.
 */
function buildMapFeatureCollection(
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
): { featureCollection: FeatureCollection; totalFeatures: number } {
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
}

export default defineEventHandler(async (event: H3Event) => {
  const { table } = event.context.params as { table: string };

  const {
    public: { allowedFileExtensions },
  } = useRuntimeConfig() as unknown as {
    public: { allowedFileExtensions: AllowedFileExtensions };
  };

  try {
    const viewsConfig = await fetchConfig();

    const permission = viewsConfig[table]?.ROUTE_LEVEL_PERMISSION ?? "member";
    await validatePermissions(event, permission);

    const config = viewsConfig[table];
    if (!config) {
      return sendError(
        event,
        createError({
          statusCode: 404,
          statusMessage: "Table config not found",
        }),
      );
    }

    const fetchResult: Awaited<ReturnType<typeof fetchMapData>> =
      await fetchMapData(table, config);
    const { mapRows, resolvedColumns } = fetchResult;

    const { featureCollection, totalFeatures } = buildMapFeatureCollection(
      mapRows as Record<string, unknown>[],
      config,
      resolvedColumns,
      resolvedColumns.filterByColumn,
      config.FILTER_OUT_VALUES_FROM_COLUMN,
    );

    const mapStatistics = {
      totalFeatures,
      dateRange: undefined as string | undefined,
    };

    const { basemaps, defaultMapboxStyle } = parseBasemaps(viewsConfig, table);

    const response = {
      allowedFileExtensions: allowedFileExtensions,
      colorColumn: config.COLOR_COLUMN,
      data: featureCollection,
      filterColumn: config.FRONT_END_FILTER_COLUMN,
      iconColumn: config.ICON_COLUMN,
      mapLegendLayerIds: config.MAP_LEGEND_LAYER_IDS,
      mapStatistics,
      mapbox3d: config.MAPBOX_3D ?? false,
      mapbox3dTerrainExaggeration: Number(
        config.MAPBOX_3D_TERRAIN_EXAGGERATION,
      ),
      mapboxAccessToken: config.MAPBOX_ACCESS_TOKEN,
      mapboxBearing: Number(config.MAPBOX_BEARING),
      mapboxLatitude: Number(config.MAPBOX_CENTER_LATITUDE),
      mapboxLongitude: Number(config.MAPBOX_CENTER_LONGITUDE),
      mapboxPitch: Number(config.MAPBOX_PITCH),
      mapboxProjection: config.MAPBOX_PROJECTION,
      mapboxStyle: defaultMapboxStyle,
      mapboxBasemaps: basemaps,
      mapboxZoom: Number(config.MAPBOX_ZOOM),
      mediaBasePath: config.MEDIA_BASE_PATH,
      mediaBasePathIcons: config.MEDIA_BASE_PATH_ICONS,
      mediaColumn: config.MEDIA_COLUMN,
      planetApiKey: config.PLANET_API_KEY,
      table,
      routeLevelPermission: config.ROUTE_LEVEL_PERMISSION,
    };

    return response;
  } catch (error) {
    if (error instanceof Error) {
      console.error("Error fetching data on API side:", error.message);
      return sendError(event, new Error(error.message));
    }
    console.error("Unknown error fetching data on API side:", error);
    return sendError(event, new Error("An unknown error occurred"));
  }
});
