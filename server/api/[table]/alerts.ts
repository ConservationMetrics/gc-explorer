import { fetchData, fetchTableConfig } from "@/server/database/dbOperations";
import murmurhash from "murmurhash";
import {
  prepareAlertsStatistics,
  prepareMinimalAlertEntries,
} from "@/server/dataProcessing/dataTransformers";
import {
  filterUnwantedKeys,
  filterGeoData,
} from "@/server/dataProcessing/dataFilters";
import { buildMinimalFeatureCollection } from "@/utils/geoUtils";
import { validatePermissions } from "@/utils/accessControls";
import { parseBasemaps } from "@/server/utils";

import type { H3Event } from "h3";
import type { AllowedFileExtensions, DataEntry, AlertsMetadata } from "@/types";
import type { FeatureCollection } from "geojson";

export default defineEventHandler(async (event: H3Event) => {
  const { table } = event.context.params as { table: string };

  const {
    public: { allowedFileExtensions },
  } = useRuntimeConfig() as unknown as {
    public: { allowedFileExtensions: AllowedFileExtensions };
  };

  try {
    const tableConfig = await fetchTableConfig(table);

    // Check visibility permissions
    const permission = tableConfig.ROUTE_LEVEL_PERMISSION ?? "member";

    // Validate user authentication and permissions
    await validatePermissions(event, permission);

    const { mainData, metadata } = (await fetchData(table)) as {
      mainData: DataEntry[];
      metadata: AlertsMetadata[];
    };

    const { mostRecentAlerts, previousAlerts } =
      prepareMinimalAlertEntries(mainData);

    const minimalAlertOptions = {
      includeProperties: ["alertID", "YYYYMM", "geographicCentroid"],
      generateId: (entry: DataEntry) => murmurhash.v3(String(entry.alertID)),
    };

    const alertsGeojsonData = {
      mostRecentAlerts: buildMinimalFeatureCollection(
        mostRecentAlerts,
        minimalAlertOptions,
      ),
      previousAlerts: buildMinimalFeatureCollection(
        previousAlerts,
        minimalAlertOptions,
      ),
    };

    const mapeoTable = tableConfig.MAPEO_TABLE;
    const mapeoCategoryIds = tableConfig.MAPEO_CATEGORY_IDS;

    let mapeoData: FeatureCollection | null = null;

    if (mapeoTable && mapeoCategoryIds) {
      // Fetch Mapeo data
      const rawMapeoData = await fetchData(mapeoTable);

      // Filter data to remove unwanted columns and substrings
      const filteredMapeoData = filterUnwantedKeys(
        rawMapeoData.mainData,
        rawMapeoData.columnsData,
        tableConfig.UNWANTED_COLUMNS,
        tableConfig.UNWANTED_SUBSTRINGS,
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
        filterColumn: tableConfig.FRONT_END_FILTER_COLUMN,
        isMapeoData: true,
      });
    }

    // Prepare statistics data for the alerts view
    const alertsStatistics = prepareAlertsStatistics(mainData, metadata);

    // Parse basemaps configuration
    const { basemaps, defaultMapboxStyle } = parseBasemaps(tableConfig);

    return {
      alertsData: alertsGeojsonData,
      alertsStatistics,
      allowedFileExtensions,
      logoUrl: tableConfig.LOGO_URL,
      mapLegendLayerIds: tableConfig.MAP_LEGEND_LAYER_IDS,
      mapbox3d: tableConfig.MAPBOX_3D ?? false,
      mapbox3dTerrainExaggeration: Number(
        tableConfig.MAPBOX_3D_TERRAIN_EXAGGERATION,
      ),
      mapboxAccessToken: tableConfig.MAPBOX_ACCESS_TOKEN,
      mapboxBearing: Number(tableConfig.MAPBOX_BEARING),
      mapboxLatitude: Number(tableConfig.MAPBOX_CENTER_LATITUDE),
      mapboxLongitude: Number(tableConfig.MAPBOX_CENTER_LONGITUDE),
      mapboxPitch: Number(tableConfig.MAPBOX_PITCH),
      mapboxProjection: tableConfig.MAPBOX_PROJECTION,
      mapboxStyle: defaultMapboxStyle,
      mapboxBasemaps: basemaps,
      mapboxZoom: Number(tableConfig.MAPBOX_ZOOM),
      mapeoTable,
      mapeoData,
      mediaBasePath: tableConfig.MEDIA_BASE_PATH,
      mediaBasePathAlerts: tableConfig.MEDIA_BASE_PATH_ALERTS,
      planetApiKey: tableConfig.PLANET_API_KEY,
      table,
      routeLevelPermission: tableConfig.ROUTE_LEVEL_PERMISSION,
    };
  } catch (error) {
    if (error instanceof Error) {
      console.error("Error fetching data on API side:", error.message);
      return sendError(event, error);
    } else {
      console.error("Unknown error fetching data on API side:", error);
      return sendError(event, new Error("An unknown error occurred"));
    }
  }
});
