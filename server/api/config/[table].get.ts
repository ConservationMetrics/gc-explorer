import { fetchViewConfigRowsForTable } from "@/server/database/dbOperations";
import { validateUserSession } from "@/utils/accessControls";

import type { H3Event } from "h3";

export default defineEventHandler(async (event: H3Event) => {
  await validateUserSession(event);

  try {
    const table = event.context.params?.table as string;
    const viewRows = await fetchViewConfigRowsForTable(table);
    return viewRows;
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
