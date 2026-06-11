import { addNewTableToConfig } from "@/server/database/dbOperations";
import { validatePermissions } from "@/utils/accessControls";

import type { H3Event } from "h3";
import type { ViewType } from "@/types";

export default defineEventHandler(async (event: H3Event) => {
  const table = event.context?.params?.table as string;
  const viewType = getQuery(event).view_type as ViewType;
  try {
    await validatePermissions(event, "admin");

    await addNewTableToConfig(table, viewType);
    return { message: "New table added successfully" };
  } catch (error) {
    if (error instanceof Error) {
      console.error(
        "Error adding new table to config on API side:",
        error.message,
      );
      // Preserve any HTTP metadata set upstream (e.g. the 409 for a duplicate view
      // type) instead of flattening every failure to a generic 500.
      const statusCode = (error as { statusCode?: number }).statusCode ?? 500;
      return sendError(
        event,
        createError({ statusCode, statusMessage: error.message }),
      );
    } else {
      console.error(
        "Unknown error adding new table to config on API side:",
        error,
      );
      return sendError(event, new Error("An unknown error occurred"));
    }
  }
});
