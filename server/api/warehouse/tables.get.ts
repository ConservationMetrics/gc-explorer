import { getFilteredTableNames, getGeospatialTableNames } from "@/server/utils";
import { validateUserSession } from "@/utils/accessControls";

import type { H3Event } from "h3";

export default defineEventHandler(async (event: H3Event) => {
  await validateUserSession(event);
  const [tables, geospatialTables] = await Promise.all([
    getFilteredTableNames(),
    getGeospatialTableNames(),
  ]);

  return { geospatialTables, tables };
});
