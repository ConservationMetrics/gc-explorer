import { updateConfig } from "@/server/database/dbOperations";
import { validatePermissions } from "@/utils/accessControls";

import type { H3Event } from "h3";
import type { ViewType } from "@/types";

export default defineEventHandler(async (event: H3Event) => {
  const table = event.context?.params?.table as string;
  const config = await readBody(event);
  const viewType = getQuery(event).view_type as ViewType | undefined;

  try {
    await validatePermissions(event, "admin");

    await updateConfig(table, config, viewType);
    return { message: "Configuration updated successfully" };
  } catch (error) {
    if (error instanceof Error) {
      console.error("Error updating config on API side:", error.message);
      return sendError(event, new Error(error.message));
    } else {
      console.error("Unknown error updating config on API side:", error);
      return sendError(event, new Error("An unknown error occurred"));
    }
  }
});
