import { d as defineEventHandler, g as getDatabaseConnection, s as sendError } from '../../../nitro/nitro.mjs';
import { a as fetchData } from '../../../_/dbOperations.mjs';
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

const data = defineEventHandler(async (event) => {
  const { table } = event.context.params;
  try {
    const db = await getDatabaseConnection(false);
    const { mainData, columnsData } = await fetchData(db, table);
    return { data: mainData, columns: columnsData };
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

export { data as default };
//# sourceMappingURL=data.mjs.map
