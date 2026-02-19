import { fetchConfig, fetchData } from "@/server/database/dbOperations";
import {
  filterOutUnwantedValues,
  filterGeoData,
} from "@/server/dataProcessing/filterData";
import { prepareMapStatistics } from "@/server/dataProcessing/transformData";
import { buildMinimalFeatureCollection } from "@/server/utils/spatialPayload";
import { validatePermissions } from "@/utils/auth";
import { parseBasemaps } from "@/server/utils/basemaps";

import type { H3Event } from "h3";
import type { AllowedFileExtensions } from "@/types/types";

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

    const { mainData } = await fetchData(table);

    // Filter data to remove unwanted values per chosen column
    const dataFilteredByValues = filterOutUnwantedValues(
      mainData,
      viewsConfig[table].FILTER_BY_COLUMN,
      viewsConfig[table].FILTER_OUT_VALUES_FROM_COLUMN,
    );

    // Filter only data with valid geofields
    const filteredGeoData = filterGeoData(dataFilteredByValues);

    const colorColumn = viewsConfig[table].COLOR_COLUMN;
    const iconColumn = viewsConfig[table].ICON_COLUMN;
    const filterColumn = viewsConfig[table].FRONT_END_FILTER_COLUMN;

    // Process geodata
    const featureCollection = buildMinimalFeatureCollection(filteredGeoData, {
      includeAllProperties: true,
      filterColumn,
    });

    // Prepare statistics data for the map view
    const mapStatistics = prepareMapStatistics(filteredGeoData);

    // Parse basemaps configuration
    const { basemaps, defaultMapboxStyle } = parseBasemaps(viewsConfig, table);

    return {
      allowedFileExtensions,
      colorColumn,
      data: featureCollection,
      filterColumn,
      iconColumn,
      mapLegendLayerIds: viewsConfig[table].MAP_LEGEND_LAYER_IDS,
      mapStatistics,
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
      mediaBasePath: viewsConfig[table].MEDIA_BASE_PATH,
      mediaBasePathIcons: viewsConfig[table].MEDIA_BASE_PATH_ICONS,
      mediaColumn: viewsConfig[table].MEDIA_COLUMN,
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
