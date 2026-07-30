import { fetchViewConfigRows } from "@/server/database/dbOperations";
import {
  getFilteredTableNames,
  getGeospatialTableNames,
} from "@/server/utils";
import { validateUserSession } from "@/utils/accessControls";

import type { H3Event } from "h3";

export default defineEventHandler(async (event: H3Event) => {
  await validateUserSession(event);

  try {
    const viewRows = await fetchViewConfigRows();
    // All warehouse tables (minus metadata/PostGIS). Per-type uniqueness is
    // enforced on the create form via GET /api/config/:table, not by hiding
    // datasets that already have some other view type.
    const [tableNames, geospatialTables] = await Promise.all([
      getFilteredTableNames(),
      getGeospatialTableNames(),
    ]);
    return {
      views: viewRows,
      availableTables: tableNames,
      availableGeospatialTables: geospatialTables,
    };
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
