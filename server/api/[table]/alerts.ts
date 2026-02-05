import { fetchConfig, fetchData } from "@/server/database/dbOperations";
import { validatePermissions } from "@/utils/auth";

import type { H3Event } from "h3";
import type {
  AllowedFileExtensions,
  DataEntry,
  AlertsMetadata,
} from "@/types/types";
import { parseBasemaps } from "@/server/utils/basemaps";

/**
 * GET /api/[table]/alerts
 *
 * Returns raw alert data, metadata, and configuration. Filtering and presentation
 * transformations are applied on the client (see subissue #269).
 */
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

    const { mainData, metadata } = (await fetchData(table)) as {
      mainData: DataEntry[];
      metadata: AlertsMetadata[];
    };

    let mapeoRawData: DataEntry[] | null = null;
    let mapeoColumns: unknown = null;
    const mapeoTable = viewsConfig[table].MAPEO_TABLE;
    const mapeoCategoryIds = viewsConfig[table].MAPEO_CATEGORY_IDS;

    if (mapeoTable && mapeoCategoryIds) {
      const rawMapeo = await fetchData(mapeoTable);
      mapeoRawData = rawMapeo.mainData;
      mapeoColumns = rawMapeo.columnsData;
    }

    const { basemaps, defaultMapboxStyle } = parseBasemaps(viewsConfig, table);

    return {
      allowedFileExtensions: allowedFileExtensions,
      logoUrl: viewsConfig[table].LOGO_URL,
      mainData,
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
      mapeoCategoryIds: mapeoCategoryIds ?? null,
      mapeoColumns,
      mapeoData: mapeoRawData,
      mapeoTable: mapeoTable ?? null,
      mediaBasePath: viewsConfig[table].MEDIA_BASE_PATH,
      mediaBasePathAlerts: viewsConfig[table].MEDIA_BASE_PATH_ALERTS,
      metadata,
      planetApiKey: viewsConfig[table].PLANET_API_KEY,
      table: table,
      routeLevelPermission: viewsConfig[table].ROUTE_LEVEL_PERMISSION,
      unwantedColumns: viewsConfig[table].UNWANTED_COLUMNS,
      unwantedSubstrings: viewsConfig[table].UNWANTED_SUBSTRINGS,
      filterColumn: viewsConfig[table].FRONT_END_FILTER_COLUMN,
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
