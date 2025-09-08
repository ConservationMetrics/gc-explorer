import { getDatabaseConnection } from "@/server/database/dbConnection";
import { fetchConfig, fetchData } from "@/server/database/dbOperations";
import {
  prepareMapData,
  transformSurveyData,
} from "@/server/dataProcessing/transformData";
import {
  filterUnwantedKeys,
  filterOutUnwantedValues,
  filterGeoData,
} from "@/server/dataProcessing/filterData";

import type { H3Event } from "h3";
import type { AllowedFileExtensions, ColumnEntry, User } from "@/types/types";
import { Role } from "@/types/types";

export default defineEventHandler(async (event: H3Event) => {
  const { table } = event.context.params as { table: string };

  const {
    public: { allowedFileExtensions },
  } = useRuntimeConfig() as unknown as {
    public: { allowedFileExtensions: AllowedFileExtensions };
  };

  try {
    const configDb = await getDatabaseConnection(true);
    const db = await getDatabaseConnection(false);

    const viewsConfig = await fetchConfig(configDb);

    // Check visibility permissions
    const permission = viewsConfig[table]?.routeLevelPermission ?? "member";

    // Skip authentication checks in CI environment
    if (!process.env.CI) {
      // For public access, no authentication required
      if (permission === "anyone") {
        // Allow access without authentication
      } else {
        // Check if user is authenticated
        const session = await getUserSession(event);

        if (!session.user) {
          throw createError({
            statusCode: 401,
            statusMessage: "Unauthorized - Authentication required",
          });
        }

        // For member permission, check user role
        if (permission === "member") {
          const typedUser = session.user as User;
          const userRole = typedUser?.userRole || Role.Viewer;

          if (userRole < Role.Member) {
            throw createError({
              statusCode: 403,
              statusMessage: "Forbidden - Insufficient permissions",
            });
          }
        }

        // For admin permission, check user role
        if (permission === "admin") {
          const typedUser = session.user as User;
          const userRole = typedUser?.userRole || Role.Viewer;

          if (userRole < Role.Admin) {
            throw createError({
              statusCode: 403,
              statusMessage: "Forbidden - Insufficient permissions",
            });
          }
        }
        // For signed-in permission, any authenticated user can access
      }
    }

    const { mainData, columnsData } = await fetchData(db, table);

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

    const response = {
      allowedFileExtensions: allowedFileExtensions,
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
      table: table,
      routeLevelPermission: viewsConfig[table].routeLevelPermission,
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
