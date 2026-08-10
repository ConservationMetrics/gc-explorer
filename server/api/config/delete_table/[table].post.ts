import { removeTableFromConfig } from "@/server/database/dbOperations";
import { getTableParam, parseRequiredViewType } from "@/server/utils/dbHelpers";
import { validatePermissions } from "@/utils/accessControls";

import type { H3Event } from "h3";

export default defineEventHandler(async (event: H3Event) => {
  const table = getTableParam(event);
  const viewType = parseRequiredViewType(getQuery(event).view_type);

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
      // Preserve any HTTP metadata set upstream instead of flattening every
      // failure to a generic 500.
      const statusCode = (error as { statusCode?: number }).statusCode ?? 500;
      return sendError(
        event,
        createError({ statusCode, statusMessage: error.message }),
      );
    } else {
      console.error(
        "Unknown error removing table from config on API side:",
        error,
      );
      return sendError(event, new Error("An unknown error occurred"));
    }
  }
});
