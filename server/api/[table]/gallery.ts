import { getDatabaseConnection } from "@/server/database/dbConnection";
import { fetchConfig, fetchData } from "@/server/database/dbOperations";
import { transformSurveyData } from "@/server/dataProcessing/transformData";
import {
  filterDataByExtension,
  filterUnwantedKeys,
  filterOutUnwantedValues,
} from "@/server/dataProcessing/filterData";

import type { H3Event } from "h3";
import type {
  AllowedFileExtensions,
  ColumnEntry,
  DataEntry,
} from "@/types/types";

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
    const { mainData, columnsData } = await fetchData(db, table);

    // Filter data to remove unwanted columns and substrings
    const filteredData = filterUnwantedKeys(
      mainData as DataEntry[],
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
    );
    // Transform data that was collected using survey apps (e.g. KoBoToolbox, Mapeo)
    const transformedData = transformSurveyData(dataWithFilesOnly);

    const response = {
      allowedFileExtensions: allowedFileExtensions,
      data: transformedData,
      filterColumn: viewsConfig[table].FRONT_END_FILTER_COLUMN,
      mediaBasePath: viewsConfig[table].MEDIA_BASE_PATH,
      table: table,
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
