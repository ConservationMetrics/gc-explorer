import { removeTableFromConfig } from "@/server/database/dbOperations";
import { getTableParam } from "@/server/utils/dbHelpers";
import { validatePermissions } from "@/utils/accessControls";

import type { H3Event } from "h3";
import type { ViewType } from "@/types";

export default defineEventHandler(async (event: H3Event) => {
  const table = getTableParam(event);
  const viewType = getQuery(event).view_type as ViewType | undefined;

  try {
    await validatePermissions(event, "admin");

    await removeTableFromConfig(table, viewType);
    return { message: "Table removed from views configuration." };
  } catch (error) {
    if (error instanceof Error) {
      console.error(
        "Error removing table from config on API side:",
        error.message,
      );
      return sendError(event, new Error(error.message));
    } else {
      console.error(
        "Unknown error removing table from config on API side:",
        error,
      );
      return sendError(event, new Error("An unknown error occurred"));
    }
  }
});
