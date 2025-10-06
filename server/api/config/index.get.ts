import { fetchConfig } from "@/server/database/dbOperations";
import { getFilteredTableNames } from "./utils";

import type { H3Event } from "h3";

export default defineEventHandler(async (event: H3Event) => {
  try {
    const viewsConfig = await fetchConfig();
    const tableNames = await getFilteredTableNames();

    // Filter out any tables that are already in viewsConfig
    const filteredTableNames = tableNames.filter(
      (name) => !Object.keys(viewsConfig).includes(name),
    );
    if (process.env.CI) {
      filteredTableNames.push("seed_survey_data");
    }
    return [viewsConfig, filteredTableNames];
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
