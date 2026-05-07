import { parseAndValidateLimit } from "@/server/utils/dbHelpers";
import {
  fetchData,
  fetchTableConfig,
  fetchTableSqlColumns,
} from "@/server/database/dbOperations";
import { validatePermissions } from "@/utils/accessControls";

import type { H3Event } from "h3";

export default defineEventHandler(async (event: H3Event) => {
  const { table } = event.context.params as { table: string };
  const limit = parseAndValidateLimit(event);

  try {
    const tableConfig = await fetchTableConfig(table);
    const permission = tableConfig.ROUTE_LEVEL_PERMISSION ?? "anyone";

    await validatePermissions(event, permission);

    const mainColumns = await fetchTableSqlColumns(table);
    const { mainData, columnsData } = await fetchData(table, {
      limit,
      mainColumns,
      includeColumnsData: true,
    });
    return {
      data: mainData,
      columns: columnsData,
      rowLimitReached: mainData.length >= limit,
    };
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
