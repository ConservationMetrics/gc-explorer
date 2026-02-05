import { fetchConfig, fetchData } from "@/server/database/dbOperations";
import {
  filterUnwantedKeys,
  filterOutUnwantedValues,
  filterGeoData,
} from "@/utils/dataProcessing/filterData";
import { prepareMapStatistics } from "@/utils/dataProcessing/transformData";
import { getRandomColor } from "@/utils/dataProcessing/helpers";
import { validatePermissions } from "@/utils/auth";

import type { H3Event } from "h3";
import type {
  AllowedFileExtensions,
  ColumnEntry,
  DataEntry,
} from "@/types/types";
import type { Feature, FeatureCollection } from "geojson";
import { parseBasemaps } from "@/server/utils/basemaps";

/**
 * Builds minimal GeoJSON FeatureCollection from raw data entries.
 * Only includes _id, geometry, and config-driven styling/filter columns.
 */
function toMinimalGeoJSON(
  data: DataEntry[],
  colorColumn?: string,
  iconColumn?: string,
  filterColumn?: string,
): FeatureCollection {
  const colorMap = new Map<string, string>();
  const features: Feature[] = data.map((entry) => {
    const properties: Record<string, string> = { _id: entry._id };

    if (colorColumn && entry[colorColumn] !== undefined) {
      properties[colorColumn] = String(entry[colorColumn]);
    }
    if (iconColumn && entry[iconColumn] !== undefined) {
      properties[iconColumn] = String(entry[iconColumn]);
    }
    if (
      filterColumn &&
      filterColumn !== colorColumn &&
      filterColumn !== iconColumn &&
      entry[filterColumn] !== undefined
    ) {
      properties[filterColumn] = String(entry[filterColumn]);
      const val = String(entry[filterColumn]);
      if (!colorMap.has(val)) colorMap.set(val, getRandomColor());
      properties["filter-color"] = colorMap.get(val)!;
    } else {
      properties["filter-color"] = "#3333FF";
    }

    let coordinates: unknown = [];
    try {
      coordinates = JSON.parse(entry.g__coordinates ?? "[]");
    } catch {
      console.warn(
        `Failed to parse coordinates for record ${entry._id}:`,
        entry.g__coordinates,
      );
    }

    return {
      type: "Feature" as const,
      id: entry._id,
      geometry: {
        type: (entry.g__type ?? "Point") as "Point" | "LineString" | "Polygon",
        coordinates,
      },
      properties,
    };
  });

  return { type: "FeatureCollection", features };
}

/**
 * GET /api/[table]/map
 *
 * Returns minimal GeoJSON for map rendering (geometry + _id + styling columns).
 * Full record details are fetched on demand via GET /api/[table]/[recordId].
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

    const { mainData, columnsData } = await fetchData(table);

    const filteredData = filterUnwantedKeys(
      mainData,
      columnsData as ColumnEntry[],
      viewsConfig[table].UNWANTED_COLUMNS,
      viewsConfig[table].UNWANTED_SUBSTRINGS,
    );
    const dataFilteredByValues = filterOutUnwantedValues(
      filteredData,
      viewsConfig[table].FILTER_BY_COLUMN,
      viewsConfig[table].FILTER_OUT_VALUES_FROM_COLUMN,
    );
    const filteredGeoData = filterGeoData(dataFilteredByValues);

    const geoJsonData = toMinimalGeoJSON(
      filteredGeoData,
      viewsConfig[table].COLOR_COLUMN,
      viewsConfig[table].ICON_COLUMN,
      viewsConfig[table].FRONT_END_FILTER_COLUMN,
    );

    const mapStatistics = prepareMapStatistics(filteredGeoData);
    const { basemaps, defaultMapboxStyle } = parseBasemaps(viewsConfig, table);

    return {
      allowedFileExtensions: allowedFileExtensions,
      colorColumn: viewsConfig[table].COLOR_COLUMN,
      data: geoJsonData,
      filterColumn: viewsConfig[table].FRONT_END_FILTER_COLUMN,
      iconColumn: viewsConfig[table].ICON_COLUMN,
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
      table: table,
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
