import { fetchViewConfigRows } from "@/server/database/dbOperations";
import { getFilteredTableNames } from "@/server/utils";
import { validateUserSession } from "@/utils/accessControls";

import type { H3Event } from "h3";

export default defineEventHandler(async (event: H3Event) => {
  await validateUserSession(event);

  try {
    const viewRows = await fetchViewConfigRows();
    const tableNames = await getFilteredTableNames();

    // Tables already exposed as a view are not offered as new datasets to add.
    const configuredDatasets = new Set(
      viewRows.map((row) => row.primaryDataset),
    );
    const filteredTableNames = tableNames.filter(
      (name) => !configuredDatasets.has(name),
    );
    if (process.env.CI) {
      filteredTableNames.push("seed_survey_data");
    }
    return { views: viewRows, availableTables: filteredTableNames };
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
