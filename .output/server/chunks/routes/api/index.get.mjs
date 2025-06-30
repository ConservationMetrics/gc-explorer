import { d as defineEventHandler, g as getDatabaseConnection, s as sendError } from '../../nitro/nitro.mjs';
import { f as fetchConfig } from '../../_/dbOperations.mjs';
import { getFilteredTableNames } from './config/utils.mjs';
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

const index_get = defineEventHandler(async (event) => {
  try {
    const configDb = await getDatabaseConnection(true);
    const db = await getDatabaseConnection(false);
    const viewsConfig = await fetchConfig(configDb);
    const tableNames = await getFilteredTableNames(db);
    const filteredTableNames = tableNames.filter(
      (name) => !Object.keys(viewsConfig).includes(name)
    );
    return [viewsConfig, filteredTableNames];
  } catch (error) {
    if (error instanceof Error) {
      console.error("Error fetching config on API side:", error.message);
      return sendError(event, new Error(error.message));
    } else {
      console.error("Unknown error fetching config on API side:", error);
      return sendError(event, new Error("An unknown error occurred"));
    }
  }
});

export { index_get as default };
//# sourceMappingURL=index.get.mjs.map
