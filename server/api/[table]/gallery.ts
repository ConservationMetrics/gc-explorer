import { fetchConfig, fetchData } from "@/server/database/dbOperations";
import {
  filterDataByExtension,
  filterUnwantedKeys,
  filterOutUnwantedValues,
} from "@/server/dataProcessing/filterData";
import { validatePermissions } from "@/utils/auth";

import type { H3Event } from "h3";
import type { AllowedFileExtensions, ColumnEntry } from "@/types/types";

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
    // Filter only data with media attachments
    const dataWithFilesOnly = filterDataByExtension(
      dataFilteredByValues,
      allowedFileExtensions,
      viewsConfig[table].MEDIA_COLUMN,
    );

    const response = {
      allowedFileExtensions: allowedFileExtensions,
      data: dataWithFilesOnly,
      filterColumn: viewsConfig[table].FRONT_END_FILTER_COLUMN,
      mediaBasePath: viewsConfig[table].MEDIA_BASE_PATH,
      mediaColumn: viewsConfig[table].MEDIA_COLUMN,
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
