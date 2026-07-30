import { fetchRecord, fetchTableConfig } from "@/server/database/dbOperations";
import { getRecordIdParam, getTableParam } from "@/server/utils/dbHelpers";
import { validatePermissions } from "@/utils/accessControls";

import type { H3Event } from "h3";
import type { ViewType } from "@/types";

export default defineEventHandler(async (event: H3Event) => {
  const table = getTableParam(event);
  const recordId = getRecordIdParam(event);
  const viewType = getQuery(event).view_type as ViewType | undefined;

  try {
    const tableConfig = await fetchTableConfig(table, viewType);

    // Check visibility permissions
    const permission = tableConfig.ROUTE_LEVEL_PERMISSION ?? "member";

    // Validate user authentication and permissions
    await validatePermissions(event, permission);

    const record = await fetchRecord(table, recordId);

    if (!record) {
      throw createError({
        statusCode: 404,
        statusMessage: "Record not found",
      });
    }

    return record;
  } catch (error) {
    if (error instanceof Error && "statusCode" in error) {
      throw error;
    }
    console.error("Error fetching record:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Internal server error",
    });
  }
});
