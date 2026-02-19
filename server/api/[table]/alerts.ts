import murmurhash from "murmurhash";

import { fetchConfig, fetchData } from "@/server/database/dbOperations";
import {
  prepareAlertData,
  prepareAlertsStatistics,
  transformToGeojson,
} from "@/server/dataProcessing/transformData";
import {
  filterUnwantedKeys,
  filterGeoData,
} from "@/server/dataProcessing/filterData";
import { buildMinimalFeatureCollection } from "~/server/utils/formatSpatialData";
import { validatePermissions } from "@/utils/auth";
import { parseBasemaps } from "@/server/utils/basemaps";

import type { H3Event } from "h3";
import type {
  AllowedFileExtensions,
  DataEntry,
  AlertsMetadata,
} from "@/types/types";
import type { FeatureCollection } from "geojson";

/**
 * Converts a Mapeo document ID (64-bit hex string) to a 32-bit integer
 * using MurmurHash for Mapbox feature state management. This is a lossy,
 * non-reversible operation.
 *
 * Mapbox requires feature IDs to be either a Number or a string that can be
 * safely cast to a Number, but Mapeo IDs are 64-bit hex strings that exceed
 * JavaScript's safe integer range. This function uses MurmurHash to generate
 * a 32-bit integer from the 64-bit hex string, ensuring compatibility with Mapbox.
 *
 * Reference: https://stackoverflow.com/questions/72040370/why-are-my-dataset-features-ids-undefined-in-mapbox-gl-while-i-have-set-them
 *
 * @param {DataEntry} entry - A raw database row containing _id or id as a 16-character hex string (e.g., "0084cdc57c0b0280")
 * @returns {number | undefined} A 32-bit integer for use with Mapbox feature state management, or undefined if the ID is not a valid Mapeo format.
 */
const generateMapboxIdFromMapeoFeatureId = (
  entry: DataEntry,
): number | undefined => {
  const mapeoId = entry._id || entry.id;
  if (
    !mapeoId ||
    typeof mapeoId !== "string" ||
    !mapeoId.match(/^[0-9a-fA-F]{16}$/)
  ) {
    return undefined;
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

    let mapeoData: FeatureCollection | null = null;

    if (mapeoTable && mapeoCategoryIds) {
      // Fetch Mapeo data
      const rawMapeoData = await fetchData(mapeoTable);

      // Filter data to remove unwanted columns and substrings
      const filteredMapeoData = filterUnwantedKeys(
        rawMapeoData.mainData,
        rawMapeoData.columnsData,
        viewsConfig[table].UNWANTED_COLUMNS,
        viewsConfig[table].UNWANTED_SUBSTRINGS,
      );

      // Filter Mapeo data to only show data where category matches any values in mapeoCategoryIds (a comma-separated string of values)
      const filteredMapeoDataByCategory = filteredMapeoData.filter(
        (row: DataEntry) => {
          return Object.keys(row).some(
            (key) =>
              key.includes("category") &&
              mapeoCategoryIds.split(",").includes(row[key]),
          );
        },
      );

      // Filter only data with valid geofields
      const filteredMapeoGeoData = filterGeoData(filteredMapeoDataByCategory);

      // Process geodata
      mapeoData = buildMinimalFeatureCollection(filteredMapeoGeoData, {
        idField: "_id",
        includeAllProperties: true,
        filterColumn: viewsConfig[table].FRONT_END_FILTER_COLUMN,
        generateId: generateMapboxIdFromMapeoFeatureId,
      });
    }

    // Prepare statistics data for the alerts view
    const alertsStatistics = prepareAlertsStatistics(mainData, metadata);

    // Parse basemaps configuration
    const { basemaps, defaultMapboxStyle } = parseBasemaps(viewsConfig, table);

    return {
      alertsData: alertsGeojsonData,
      alertsStatistics,
      allowedFileExtensions,
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
      mapeoTable,
      mapeoData,
      mediaBasePath: viewsConfig[table].MEDIA_BASE_PATH,
      mediaBasePathAlerts: viewsConfig[table].MEDIA_BASE_PATH_ALERTS,
      planetApiKey: viewsConfig[table].PLANET_API_KEY,
      table,
      routeLevelPermission: viewsConfig[table].ROUTE_LEVEL_PERMISSION,
    };
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
