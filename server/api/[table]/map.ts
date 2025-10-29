import { fetchConfig, fetchData } from "@/server/database/dbOperations";
import {
  prepareMapData,
  prepareMapStatistics,
  transformSurveyData,
} from "@/server/dataProcessing/transformData";
import {
  filterUnwantedKeys,
  filterOutUnwantedValues,
  filterGeoData,
} from "@/server/dataProcessing/filterData";
import { validatePermissions } from "@/utils/auth";

import type { H3Event } from "h3";
import type {
  AllowedFileExtensions,
  ColumnEntry,
  BasemapConfig,
} from "@/types/types";

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

    const { mainData, columnsData } = await fetchData(table);

    // Filter data to remove unwanted columns and substrings
    const filteredData = filterUnwantedKeys(
      mainData,
      columnsData as ColumnEntry[],
      viewsConfig[table].UNWANTED_COLUMNS,
      viewsConfig[table].UNWANTED_SUBSTRINGS,
    );
    // Filter data to remove unwanted values per chosen column
    const dataFilteredByValues = filterOutUnwantedValues(
      filteredData,
      viewsConfig[table].FILTER_BY_COLUMN,
      viewsConfig[table].FILTER_OUT_VALUES_FROM_COLUMN,
    );
    // Filter only data with valid geofields
    const filteredGeoData = filterGeoData(dataFilteredByValues);
    // Transform data that was collected using survey apps (e.g. KoBoToolbox, Mapeo)
    const transformedData = transformSurveyData(filteredGeoData);
    // Process geodata
    const processedGeoData = prepareMapData(
      transformedData,
      viewsConfig[table].FRONT_END_FILTER_COLUMN,
    );

    // Prepare statistics data for the map view
    const mapStatistics = prepareMapStatistics(processedGeoData);

    // Parse basemaps configuration
    let basemaps: BasemapConfig[] = [];
    let defaultMapboxStyle: string | undefined;
    
    if (viewsConfig[table].MAPBOX_BASEMAPS) {
      try {
        basemaps = JSON.parse(viewsConfig[table].MAPBOX_BASEMAPS);
        // Find the default basemap
        const defaultBasemap = basemaps.find((b) => b.isDefault);
        if (defaultBasemap) {
          defaultMapboxStyle = defaultBasemap.style;
        } else if (basemaps.length > 0) {
          // If no default is set, use the first one
          defaultMapboxStyle = basemaps[0].style;
        }
      } catch {
        // If parsing fails, fall back to legacy MAPBOX_STYLE
        defaultMapboxStyle = viewsConfig[table].MAPBOX_STYLE;
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
    } else if (viewsConfig[table].MAPBOX_STYLE) {
      // Legacy fallback
      defaultMapboxStyle = viewsConfig[table].MAPBOX_STYLE;
      basemaps = [
        {
          name: "Default Style",
          style: defaultMapboxStyle,
          isDefault: true,
        },
      ];
    }

    const response = {
      allowedFileExtensions: allowedFileExtensions,
      data: processedGeoData,
      filterColumn: viewsConfig[table].FRONT_END_FILTER_COLUMN,
      mapLegendLayerIds: viewsConfig[table].MAP_LEGEND_LAYER_IDS,
      mapStatistics: mapStatistics,
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
