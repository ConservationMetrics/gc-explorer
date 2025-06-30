import { d as defineEventHandler, u as useRuntimeConfig, g as getDatabaseConnection, s as sendError } from '../../../nitro/nitro.mjs';
import { f as fetchConfig, a as fetchData } from '../../../_/dbOperations.mjs';
import { f as filterUnwantedKeys, e as filterOutUnwantedValues, a as filterGeoData, b as transformSurveyData, c as prepareMapData } from '../../../_/filterData.mjs';
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
import 'murmurhash';

const map = defineEventHandler(async (event) => {
  const { table } = event.context.params;
  const {
    public: { allowedFileExtensions }
  } = useRuntimeConfig();
  try {
    const configDb = await getDatabaseConnection(true);
    const db = await getDatabaseConnection(false);
    const viewsConfig = await fetchConfig(configDb);
    const { mainData, columnsData } = await fetchData(db, table);
    const filteredData = filterUnwantedKeys(
      mainData,
      columnsData,
      viewsConfig[table].UNWANTED_COLUMNS,
      viewsConfig[table].UNWANTED_SUBSTRINGS
    );
    const dataFilteredByValues = filterOutUnwantedValues(
      filteredData,
      viewsConfig[table].FILTER_BY_COLUMN,
      viewsConfig[table].FILTER_OUT_VALUES_FROM_COLUMN
    );
    const filteredGeoData = filterGeoData(dataFilteredByValues);
    const transformedData = transformSurveyData(filteredGeoData);
    const processedGeoData = prepareMapData(
      transformedData,
      viewsConfig[table].FRONT_END_FILTER_COLUMN
    );
    const response = {
      allowedFileExtensions,
      data: processedGeoData,
      filterColumn: viewsConfig[table].FRONT_END_FILTER_COLUMN,
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
      mediaBasePath: viewsConfig[table].MEDIA_BASE_PATH,
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

export { map as default };
//# sourceMappingURL=map.mjs.map
