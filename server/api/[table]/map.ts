import {
  fetchData,
  fetchTableConfig,
  fetchTableSqlColumns,
} from "@/server/database/dbOperations";
import {
  filterOutUnwantedValues,
  filterGeoData,
} from "@/server/dataProcessing/dataFilters";
import { prepareMapStatistics } from "@/server/dataProcessing/dataTransformers";
import { buildMinimalFeatureCollection } from "@/utils/geoUtils";
import { validatePermissions } from "@/utils/accessControls";
import { parseBasemaps } from "@/server/utils";
import { parseAndValidateLimit } from "@/server/utils/dbHelpers";

import type { H3Event } from "h3";
import type { AllowedFileExtensions } from "@/types";

export default defineEventHandler(async (event: H3Event) => {
  const { table } = event.context.params as { table: string };
  const limit = parseAndValidateLimit(event);

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

    const colorColumn = tableConfig.COLOR_COLUMN;
    const iconColumn = tableConfig.ICON_COLUMN;
    const filterColumn = tableConfig.FRONT_END_FILTER_COLUMN;
    const timestampColumn = tableConfig.TIMESTAMP_COLUMN;
    const filterByColumn = tableConfig.FILTER_BY_COLUMN;

    const tableSqlColumns = await fetchTableSqlColumns(table);
    const dateLikeColumns = tableSqlColumns.filter((column) =>
      /(date|time|created|modified|updated)/i.test(column),
    );
    const mainColumns = Array.from(
      new Set(
        [
          "_id",
          "g__type",
          "g__coordinates",
          colorColumn,
          iconColumn,
          filterColumn,
          timestampColumn,
          filterByColumn,
          ...dateLikeColumns,
        ].filter((column): column is string => Boolean(column)),
      ),
    );
    const { mainData } = await fetchData(table, {
      limit,
      mainColumns,
    });

    // Filter data to remove unwanted values per chosen column
    const dataFilteredByValues = filterOutUnwantedValues(
      mainData,
      filterByColumn,
      tableConfig.FILTER_OUT_VALUES_FROM_COLUMN,
    );

    // Filter only data with valid geofields
    const filteredGeoData = filterGeoData(dataFilteredByValues);

    // Process geodata
    const includeProperties = [colorColumn, iconColumn, timestampColumn].filter(
      (column): column is string => !!column,
    );
    const featureCollection = buildMinimalFeatureCollection(filteredGeoData, {
      includeProperties,
      filterColumn,
    });

    // Prepare statistics data for the map view
    const mapStatistics = prepareMapStatistics(filteredGeoData);

    // Parse basemaps configuration
    const { basemaps, defaultMapboxStyle } = parseBasemaps(tableConfig);

    return {
      allowedFileExtensions,
      colorColumn,
      data: featureCollection,
      filterColumn,
      iconColumn,
      timestampColumn: timestampColumn ?? undefined,
      mapLegendLayerIds: tableConfig.MAP_LEGEND_LAYER_IDS,
      mapStatistics,
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
      mediaBasePath: tableConfig.MEDIA_BASE_PATH,
      mediaBasePathIcons: tableConfig.MEDIA_BASE_PATH_ICONS,
      mediaColumn: tableConfig.MEDIA_COLUMN,
      planetApiKey: tableConfig.PLANET_API_KEY,
      table,
      rowLimitReached: mainData.length >= limit,
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
