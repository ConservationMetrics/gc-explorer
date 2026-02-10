import murmurhash from "murmurhash";

import {
  fetchConfig,
  fetchData,
  fetchMapData,
} from "@/server/database/dbOperations";
import {
  prepareAlertData,
  prepareAlertsStatistics,
  transformToGeojson,
} from "@/server/dataProcessing/transformData";
import { buildMapFeatureCollection } from "@/server/utils/formatSpatialData";
import { validatePermissions } from "@/utils/auth";

import type { H3Event } from "h3";
import type {
  AllowedFileExtensions,
  AlertsMetadata,
  DataEntry,
  ViewConfig,
} from "@/types/types";
import { parseBasemaps } from "@/server/utils/basemaps";

/**
 * Converts a Mapeo document ID (64-bit hex string) to a 32-bit integer
 * using MurmurHash for Mapbox feature state management. This is a lossy, non-reversible operation.
 *
 * Mapbox requires feature IDs to be either a Number or a string that can be safely
 * cast to a Number, but Mapeo IDs are 64-bit hex strings that exceed JavaScript's
 * safe integer range. This function uses MurmurHash to generate a 32-bit integer
 * from the 64-bit hex string, ensuring compatibility with Mapbox.
 *
 * Reference: https://stackoverflow.com/questions/72040370/why-are-my-dataset-features-ids-undefined-in-mapbox-gl-while-i-have-set-them
 *
 * @param {string} mapeoId - The Mapeo document ID as a 16-character hex string (e.g., "0084cdc57c0b0280")
 * @returns {number} - A 32-bit integer for use with Mapbox feature state management
 * @throws {Error} - If the input is not a valid 16-character hex string
 */
const generateMapboxIdFromMapeoFeatureId = (mapeoId: string): number => {
  if (
    !mapeoId ||
    typeof mapeoId !== "string" ||
    !mapeoId.match(/^[0-9a-fA-F]{16}$/)
  ) {
    throw new Error(
      `Invalid Mapeo ID format: ${mapeoId}. Expected 16-character hex string.`,
    );
  }

  return murmurhash.v3(mapeoId);
};

export default defineEventHandler(async (event: H3Event) => {
  const { table } = event.context.params as { table: string };

  const {
    public: { allowedFileExtensions },
  } = useRuntimeConfig() as unknown as {
    public: { allowedFileExtensions: AllowedFileExtensions };
  };

  try {
    const viewsConfig = await fetchConfig();

    // Check visibility permissions
    const permission = viewsConfig[table]?.ROUTE_LEVEL_PERMISSION ?? "member";

    // Validate user authentication and permissions
    await validatePermissions(event, permission);

    const { mainData, metadata } = (await fetchData(table)) as {
      mainData: DataEntry[];
      metadata: AlertsMetadata[];
    };

    // Prepare alerts data for the alerts view
    const changeDetectionData = prepareAlertData(mainData, table as string);
    const alertsGeojsonData = {
      mostRecentAlerts: transformToGeojson(
        changeDetectionData.mostRecentAlerts,
      ),
      previousAlerts: transformToGeojson(changeDetectionData.previousAlerts),
    };

    // Prepare Mapeo data for the alerts view
    const mapeoTable = viewsConfig[table].MAPEO_TABLE;
    const mapeoCategoryIds = viewsConfig[table].MAPEO_CATEGORY_IDS;

    let mapeoData = null;

    if (mapeoTable && mapeoCategoryIds) {
      // Always use minimal fetch + shared spatial payload (config optional when Mapeo table has no view config).
      const mapeoConfig = viewsConfig[mapeoTable] ?? undefined;
      const fetchResult = await fetchMapData(mapeoTable, mapeoConfig);
      const { mapRows, resolvedColumns } = fetchResult;
      const categoryCol =
        resolvedColumns.filterColumn ?? resolvedColumns.filterByColumn;
      const allowedCategoryIds = mapeoCategoryIds
        .split(",")
        .map((s) => s.trim());
      const rowsInCategory =
        categoryCol != null
          ? (mapRows as Record<string, unknown>[]).filter((row) =>
              allowedCategoryIds.includes(
                String(row[categoryCol] ?? "").trim(),
              ),
            )
          : (mapRows as Record<string, unknown>[]);

      // When no view config for Mapeo table, use minimal config for buildMapFeatureCollection (filter column only).
      const configForBuild: ViewConfig =
        mapeoConfig ??
        (categoryCol
          ? {
              FRONT_END_FILTER_COLUMN: categoryCol,
              FILTER_BY_COLUMN: categoryCol,
            }
          : {});
      const { featureCollection } = buildMapFeatureCollection(
        rowsInCategory,
        configForBuild,
        resolvedColumns,
        resolvedColumns.filterByColumn,
        mapeoConfig?.FILTER_OUT_VALUES_FROM_COLUMN,
      );

      // Add normalized IDs for Mapbox feature state; convert FeatureCollection to mapeoData shape expected by AlertsDashboard.
      mapeoData = featureCollection.features.map((f) => {
        const props = (f.properties ?? {}) as Record<string, unknown>;
        const id = f.id ?? props._id;
        if (
          id != null &&
          typeof id === "string" &&
          id.match(/^[0-9a-fA-F]{16}$/)
        ) {
          props.normalizedId = generateMapboxIdFromMapeoFeatureId(id);
        }
        const geom = f.geometry;
        const coords =
          geom && "coordinates" in geom
            ? JSON.stringify(geom.coordinates)
            : "[]";
        const type = geom && "type" in geom ? geom.type : "Point";
        return {
          ...props,
          id: id ?? props._id,
          geotype: type,
          geocoordinates: coords,
          "filter-color": props["filter-color"],
        };
      });
    }

    // Prepare statistics data for the alerts view
    const alertsStatistics = prepareAlertsStatistics(mainData, metadata);

    // Parse basemaps configuration
    const { basemaps, defaultMapboxStyle } = parseBasemaps(viewsConfig, table);

    const response = {
      alertsData: alertsGeojsonData,
      alertsStatistics: alertsStatistics,
      allowedFileExtensions: allowedFileExtensions,
      logoUrl: viewsConfig[table].LOGO_URL,
      mapLegendLayerIds: viewsConfig[table].MAP_LEGEND_LAYER_IDS,
      mapbox3d: viewsConfig[table].MAPBOX_3D ?? false,
      mapbox3dTerrainExaggeration: Number(
        viewsConfig[table].MAPBOX_3D_TERRAIN_EXAGGERATION,
      ),
      mapboxAccessToken: viewsConfig[table].MAPBOX_ACCESS_TOKEN,
      mapboxBearing: Number(viewsConfig[table].MAPBOX_BEARING),
      mapboxLatitude: Number(viewsConfig[table].MAPBOX_CENTER_LATITUDE),
      mapboxLongitude: Number(viewsConfig[table].MAPBOX_CENTER_LONGITUDE),
      mapboxPitch: Number(viewsConfig[table].MAPBOX_PITCH),
      mapboxProjection: viewsConfig[table].MAPBOX_PROJECTION,
      mapboxStyle: defaultMapboxStyle,
      mapboxBasemaps: basemaps,
      mapboxZoom: Number(viewsConfig[table].MAPBOX_ZOOM),
      mapeoData: mapeoData,
      mediaBasePath: viewsConfig[table].MEDIA_BASE_PATH,
      mediaBasePathAlerts: viewsConfig[table].MEDIA_BASE_PATH_ALERTS,
      planetApiKey: viewsConfig[table].PLANET_API_KEY,
      table: table,
      routeLevelPermission: viewsConfig[table].ROUTE_LEVEL_PERMISSION,
    };

    return response;
  } catch (error) {
    if (error instanceof Error) {
      console.error("Error fetching data on API side:", error.message);
      return sendError(event, new Error(error.message));
    } else {
      console.error("Unknown error fetching data on API side:", error);
      return sendError(event, new Error("An unknown error occurred"));
    }
  }
});
