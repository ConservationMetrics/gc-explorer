import { fetchConfig, fetchMapGeo } from "@/server/database/dbOperations";
import {
  isValidGeoRow,
  filterOutUnwantedValues,
  buildMapFeatureCollection,
} from "@/server/utils/mapGeo";
import { validatePermissions } from "@/utils/auth";

import type { H3Event } from "h3";
import type { AllowedFileExtensions } from "@/types/types";
import { parseBasemaps } from "@/server/utils/basemaps";

/**
 * GET /api/[table]/map
 *
 * Returns minimal GeoJSON FeatureCollection for map rendering: _id, g__type,
 * g__coordinates, and config-driven COLOR_COLUMN / ICON_COLUMN. Filtering is
 * done on the server. Full records are fetched on demand via GET /api/[table]/[recordId].
 */
export default defineEventHandler(async (event: H3Event) => {
  const { table } = event.context.params as { table: string };

  const {
    public: { allowedFileExtensions },
  } = useRuntimeConfig() as unknown as {
    public: { allowedFileExtensions: AllowedFileExtensions };
  };

  try {
    const timings: Record<string, number> = {};
    const startTotal = performance.now();

    const viewsConfig = await fetchConfig();
    timings.fetchConfig = performance.now() - startTotal;

    const permission = viewsConfig[table]?.ROUTE_LEVEL_PERMISSION ?? "member";
    await validatePermissions(event, permission);

    const config = viewsConfig[table];
    if (!config) {
      throw createError({
        statusCode: 404,
        statusMessage: "Not Found",
        message: `Table '${table}' not found`,
      });
    }

    const startFetch = performance.now();
    const rows = await fetchMapGeo(table, config);
    timings.fetchMapGeo = performance.now() - startFetch;

    const filteredByValues = filterOutUnwantedValues(
      rows,
      config.FILTER_BY_COLUMN,
      config.FILTER_OUT_VALUES_FROM_COLUMN,
    );
    const validGeoRows = filteredByValues.filter(isValidGeoRow);

    const startBuild = performance.now();
    const featureCollection = buildMapFeatureCollection(validGeoRows, config);
    const mapStatistics = { totalFeatures: featureCollection.features.length };
    timings.buildGeoJSON = performance.now() - startBuild;

    const { basemaps, defaultMapboxStyle } = parseBasemaps(viewsConfig, table);

    timings.total = performance.now() - startTotal;
    if (process.env.NODE_ENV !== "production") {
      console.log(
        `[map] /api/${table}/map timings (ms):`,
        JSON.stringify(timings),
      );
    }

    return {
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
      table: table,
      routeLevelPermission: config.ROUTE_LEVEL_PERMISSION,
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
