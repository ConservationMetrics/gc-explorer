import { fetchConfig, fetchMapData } from "@/server/database/dbOperations";
import { buildMapFeatureCollection } from "@/server/utils/spatialPayload";
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
