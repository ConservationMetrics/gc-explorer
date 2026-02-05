import { fetchConfig, fetchData } from "@/server/database/dbOperations";
import { validatePermissions } from "@/utils/auth";

import type { H3Event } from "h3";
import type { AllowedFileExtensions } from "@/types/types";

/**
 * GET /api/[table]/gallery
 *
 * Returns raw data and configuration. Filtering and presentation transformations
 * are applied on the client (see subissue #269).
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

    return {
      allowedFileExtensions: allowedFileExtensions,
      columns: columnsData,
      data: mainData,
      filterColumn: viewsConfig[table].FRONT_END_FILTER_COLUMN,
      mediaBasePath: viewsConfig[table].MEDIA_BASE_PATH,
      mediaColumn: viewsConfig[table].MEDIA_COLUMN,
      table: table,
      routeLevelPermission: viewsConfig[table].ROUTE_LEVEL_PERMISSION,
      unwantedColumns: viewsConfig[table].UNWANTED_COLUMNS,
      unwantedSubstrings: viewsConfig[table].UNWANTED_SUBSTRINGS,
      filterByColumn: viewsConfig[table].FILTER_BY_COLUMN,
      filterOutValuesFromColumn:
        viewsConfig[table].FILTER_OUT_VALUES_FROM_COLUMN,
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
