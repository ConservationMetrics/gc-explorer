import { d as defineEventHandler, u as useRuntimeConfig, g as getDatabaseConnection, s as sendError } from '../../../nitro/nitro.mjs';
import { f as fetchConfig, a as fetchData } from '../../../_/dbOperations.mjs';
import { f as filterUnwantedKeys, e as filterOutUnwantedValues, g as filterDataByExtension, b as transformSurveyData } from '../../../_/filterData.mjs';
import 'node:http';
import 'node:https';
import 'node:crypto';
import 'node:events';
import 'node:buffer';
import 'node:fs';
import 'node:path';
import 'pg';
import 'node:url';
import 'ipx';
import 'murmurhash';

const gallery = defineEventHandler(async (event) => {
  const { table } = event.context.params;
  const {
    public: { allowedFileExtensions }
  } = useRuntimeConfig();
  try {
    const configDb = await getDatabaseConnection(true);
    const db = await getDatabaseConnection(false);
    const viewsConfig = await fetchConfig(configDb);
    const { mainData, columnsData } = await fetchData(db, table);
    const filteredData = filterUnwantedKeys(
      mainData,
      columnsData,
      viewsConfig[table].UNWANTED_COLUMNS,
      viewsConfig[table].UNWANTED_SUBSTRINGS
    );
    const dataFilteredByValues = filterOutUnwantedValues(
      filteredData,
      viewsConfig[table].FILTER_BY_COLUMN,
      viewsConfig[table].FILTER_OUT_VALUES_FROM_COLUMN
    );
    const dataWithFilesOnly = filterDataByExtension(
      dataFilteredByValues,
      allowedFileExtensions
    );
    const transformedData = transformSurveyData(dataWithFilesOnly);
    const response = {
      allowedFileExtensions,
      data: transformedData,
      filterColumn: viewsConfig[table].FRONT_END_FILTER_COLUMN,
      mediaBasePath: viewsConfig[table].MEDIA_BASE_PATH,
      table
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

export { gallery as default };
//# sourceMappingURL=gallery.mjs.map
