import type { H3Event } from "h3";
import { defineEventHandler, sendError } from "h3";
import { getDatabaseConnection } from "@/server/database/dbConnection";
import { fetchConfig, fetchData } from "../../database/dbOperations";
import {
  prepareAlertData,
  prepareAlertsStatistics,
  transformToGeojson,
  prepareMapData,
  transformSurveyData,
} from "../../dataProcessing/transformData";
import {
  filterUnwantedKeys,
  filterGeoData,
} from "../../dataProcessing/filterData";
import type {
  AllowedFileExtensions,
  DataEntry,
  AlertsMetadata,
} from "../../types";

export default defineEventHandler(async (event: H3Event) => {
  const { table } = event.context.params as { table: string };

  const {
    public: { allowedFileExtensions },
    isSqlite,
  } = useRuntimeConfig() as unknown as {
    public: { allowedFileExtensions: AllowedFileExtensions };
    isSqlite: boolean;
  };

  try {
    const configDb = await getDatabaseConnection(true);
    const db = await getDatabaseConnection(false);

    const viewsConfig = await fetchConfig(configDb, isSqlite);
    const { mainData, metadata } = (await fetchData(db, table, isSqlite)) as {
      mainData: DataEntry[];
      metadata: AlertsMetadata[];
    };

    // Prepare alerts data for the alerts view
    const changeDetectionData = prepareAlertData(mainData);
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
      // Fetch Mapeo data
      const rawMapeoData = await fetchData(db, mapeoTable, isSqlite);

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
      // Transform data that was collected using survey apps (e.g. KoBoToolbox, Mapeo)
      const transformedMapeoData = transformSurveyData(filteredMapeoGeoData);
      // Process geodata
      const processedMapeoData = prepareMapData(
        transformedMapeoData,
        viewsConfig[table].FRONT_END_FILTER_COLUMN,
      );

      mapeoData = processedMapeoData;
    }

    // Prepare statistics data for the alerts view
    const alertsStatistics = prepareAlertsStatistics(mainData, metadata);

    const response = {
      alertsData: alertsGeojsonData,
      alertsStatistics: alertsStatistics,
      allowedFileExtensions: allowedFileExtensions,
      logoUrl: viewsConfig[table].LOGO_URL,
      mapLegendLayerIds: viewsConfig[table].MAP_LEGEND_LAYER_IDS,
      mapbox3d: viewsConfig[table].MAPBOX_3D === "YES",
      mapboxAccessToken: viewsConfig[table].MAPBOX_ACCESS_TOKEN,
      mapboxBearing: Number(viewsConfig[table].MAPBOX_BEARING),
      mapboxLatitude: Number(viewsConfig[table].MAPBOX_CENTER_LATITUDE),
      mapboxLongitude: Number(viewsConfig[table].MAPBOX_CENTER_LONGITUDE),
      mapboxPitch: Number(viewsConfig[table].MAPBOX_PITCH),
      mapboxProjection: viewsConfig[table].MAPBOX_PROJECTION,
      mapboxStyle: viewsConfig[table].MAPBOX_STYLE,
      mapboxZoom: Number(viewsConfig[table].MAPBOX_ZOOM),
      mapeoData: mapeoData,
      mediaBasePath: viewsConfig[table].MEDIA_BASE_PATH,
      mediaBasePathAlerts: viewsConfig[table].MEDIA_BASE_PATH_ALERTS,
      planetApiKey: viewsConfig[table].PLANET_API_KEY,
      table: table,
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
