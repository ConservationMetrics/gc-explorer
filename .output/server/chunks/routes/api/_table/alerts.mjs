import { d as defineEventHandler, u as useRuntimeConfig, g as getDatabaseConnection, s as sendError } from '../../../nitro/nitro.mjs';
import murmurhash from 'murmurhash';
import { f as fetchConfig, a as fetchData } from '../../../_/dbOperations.mjs';
import { p as prepareAlertData, t as transformToGeojson, f as filterUnwantedKeys, a as filterGeoData, b as transformSurveyData, c as prepareMapData, d as prepareAlertsStatistics } from '../../../_/filterData.mjs';
import 'node:http';
import 'node:https';
import 'node:crypto';
import 'node:events';
import 'node:buffer';
import 'node:fs';
import 'node:path';
import 'pg';
import 'node:url';
import 'ipx';

const generateMapboxIdFromMapeoFeatureId = (mapeoId) => {
  if (!mapeoId || typeof mapeoId !== "string" || !mapeoId.match(/^[0-9a-fA-F]{16}$/)) {
    throw new Error(
      `Invalid Mapeo ID format: ${mapeoId}. Expected 16-character hex string.`
    );
  }
  return murmurhash.v3(mapeoId);
};
const alerts = defineEventHandler(async (event) => {
  const { table } = event.context.params;
  const {
    public: { allowedFileExtensions }
  } = useRuntimeConfig();
  try {
    const configDb = await getDatabaseConnection(true);
    const db = await getDatabaseConnection(false);
    const viewsConfig = await fetchConfig(configDb);
    const { mainData, metadata } = await fetchData(db, table);
    const changeDetectionData = prepareAlertData(mainData);
    const alertsGeojsonData = {
      mostRecentAlerts: transformToGeojson(
        changeDetectionData.mostRecentAlerts
      ),
      previousAlerts: transformToGeojson(changeDetectionData.previousAlerts)
    };
    const mapeoTable = viewsConfig[table].MAPEO_TABLE;
    const mapeoCategoryIds = viewsConfig[table].MAPEO_CATEGORY_IDS;
    let mapeoData = null;
    if (mapeoTable && mapeoCategoryIds) {
      const rawMapeoData = await fetchData(db, mapeoTable);
      const filteredMapeoData = filterUnwantedKeys(
        rawMapeoData.mainData,
        rawMapeoData.columnsData,
        viewsConfig[table].UNWANTED_COLUMNS,
        viewsConfig[table].UNWANTED_SUBSTRINGS
      );
      const filteredMapeoDataByCategory = filteredMapeoData.filter(
        (row) => {
          return Object.keys(row).some(
            (key) => key.includes("category") && mapeoCategoryIds.split(",").includes(row[key])
          );
        }
      );
      const filteredMapeoGeoData = filterGeoData(filteredMapeoDataByCategory);
      const transformedMapeoData = transformSurveyData(filteredMapeoGeoData);
      const processedMapeoData = prepareMapData(
        transformedMapeoData,
        viewsConfig[table].FRONT_END_FILTER_COLUMN
      );
      const mapeoDataWithNormalizedIds = processedMapeoData.map((item) => {
        if (item.id && typeof item.id === "string" && item.id.match(/^[0-9a-fA-F]{16}$/)) {
          item.normalizedId = generateMapboxIdFromMapeoFeatureId(item.id);
        }
        return item;
      });
      mapeoData = mapeoDataWithNormalizedIds;
    }
    const alertsStatistics = prepareAlertsStatistics(mainData, metadata);
    const response = {
      alertsData: alertsGeojsonData,
      alertsStatistics,
      allowedFileExtensions,
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
      mapeoData,
      mediaBasePath: viewsConfig[table].MEDIA_BASE_PATH,
      mediaBasePathAlerts: viewsConfig[table].MEDIA_BASE_PATH_ALERTS,
      planetApiKey: viewsConfig[table].PLANET_API_KEY,
      table
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

export { alerts as default };
//# sourceMappingURL=alerts.mjs.map
