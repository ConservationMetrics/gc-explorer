import { fetchConfig, fetchData } from "@/server/database/dbOperations";
import {
  filterDataByExtension,
  filterUnwantedKeys,
  filterOutUnwantedValues,
} from "@/server/dataProcessing/dataFilters";
import { parseAndValidateLimit } from "@/server/utils";
import { validatePermissions } from "@/utils/accessControls";

import type { H3Event } from "h3";
import type { AllowedFileExtensions, ColumnEntry } from "@/types";

export default defineEventHandler(async (event: H3Event) => {
  const { table } = event.context.params as { table: string };
  const limit = parseAndValidateLimit(event);

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

    const { mainData, columnsData } = await fetchData(table, limit);

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
    // Filter only data with media attachments
    const dataWithFilesOnly = filterDataByExtension(
      dataFilteredByValues,
      allowedFileExtensions,
      viewsConfig[table].MEDIA_COLUMN,
    );

    const filterColumn = viewsConfig[table].FRONT_END_FILTER_COLUMN;
    const mediaColumn = viewsConfig[table].MEDIA_COLUMN;
    const timestampColumn = viewsConfig[table].TIMESTAMP_COLUMN;

    // Return minimal records: ID + columns needed for filtering and media display
    const minimalData = dataWithFilesOnly.map((entry) => {
      const minimal: Record<string, unknown> = {};
      if (entry._id != null) minimal._id = entry._id;
      if (filterColumn && entry[filterColumn] != null) {
        minimal[filterColumn] = entry[filterColumn];
      }
      if (timestampColumn && entry[timestampColumn] != null) {
        minimal[timestampColumn] = entry[timestampColumn];
      }
      if (mediaColumn && entry[mediaColumn] != null) {
        minimal[mediaColumn] = entry[mediaColumn];
      }
      return minimal;
    });

    return {
      allowedFileExtensions,
      data: minimalData,
      filterColumn,
      mediaBasePath: viewsConfig[table].MEDIA_BASE_PATH,
      mediaColumn,
      table,
      timestampColumn: timestampColumn ?? undefined,
      routeLevelPermission: viewsConfig[table].ROUTE_LEVEL_PERMISSION,
      rowLimitReached: mainData.length >= limit,
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
