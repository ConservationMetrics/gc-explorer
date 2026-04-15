import { fetchConfig, fetchData } from "@/server/database/dbOperations";
import {
  filterDataByExtension,
  filterUnwantedKeys,
  filterOutUnwantedValues,
} from "@/server/dataProcessing/dataFilters";
import { validatePermissions } from "@/utils/accessControls";
import { requireTableViewConfig } from "@/server/utils";

import type { H3Event } from "h3";
import type { AllowedFileExtensions, ColumnEntry } from "@/types";

export default defineEventHandler(async (event: H3Event) => {
  const { table } = event.context.params as { table: string };

  const {
    public: { allowedFileExtensions },
  } = useRuntimeConfig() as unknown as {
    public: { allowedFileExtensions: AllowedFileExtensions };
  };

  try {
    const viewsConfig = await fetchConfig();
    const tableConfig = requireTableViewConfig(viewsConfig, table);

    // Check visibility permissions
    const permission = tableConfig.ROUTE_LEVEL_PERMISSION ?? "member";

    // Validate user authentication and permissions
    await validatePermissions(event, permission);

    const { mainData, columnsData } = await fetchData(table);

    // Filter data to remove unwanted columns and substrings
    const filteredData = filterUnwantedKeys(
      mainData,
      columnsData as ColumnEntry[],
      tableConfig.UNWANTED_COLUMNS,
      tableConfig.UNWANTED_SUBSTRINGS,
    );
    // Filter data to remove unwanted values per chosen column
    const dataFilteredByValues = filterOutUnwantedValues(
      filteredData,
      tableConfig.FILTER_BY_COLUMN,
      tableConfig.FILTER_OUT_VALUES_FROM_COLUMN,
    );
    // Filter only data with media attachments
    const dataWithFilesOnly = filterDataByExtension(
      dataFilteredByValues,
      allowedFileExtensions,
      tableConfig.MEDIA_COLUMN,
    );

    const filterColumn = tableConfig.FRONT_END_FILTER_COLUMN;
    const mediaColumn = tableConfig.MEDIA_COLUMN;
    const timestampColumn = tableConfig.TIMESTAMP_COLUMN;

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

    const response = {
      allowedFileExtensions: allowedFileExtensions,
      data: minimalData,
      filterColumn,
      mediaBasePath: tableConfig.MEDIA_BASE_PATH,
      mediaColumn,
      table: table,
      timestampColumn: timestampColumn ?? undefined,
      routeLevelPermission: tableConfig.ROUTE_LEVEL_PERMISSION,
    };

    return response;
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
