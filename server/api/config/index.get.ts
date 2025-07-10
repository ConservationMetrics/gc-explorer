import { getDatabaseConnection } from "@/server/database/dbConnection";
import { fetchConfig } from "@/server/database/dbOperations";
import { getFilteredTableNames } from "./utils";

import type { H3Event } from "h3";

export default defineEventHandler(async (event: H3Event) => {
  try {
    console.log("Config API endpoint called");
    const configDb = await getDatabaseConnection(true);
    const db = await getDatabaseConnection(false);

    const viewsConfig = await fetchConfig(configDb);
    console.log("Views config:", JSON.stringify(viewsConfig, null, 2));
    const tableNames = await getFilteredTableNames(db);

    // Filter out any tables that are already in viewsConfig
    const filteredTableNames = tableNames.filter(
      (name) => !Object.keys(viewsConfig).includes(name),
    );

    const result = [viewsConfig, filteredTableNames];
    console.log("Config API returning:", JSON.stringify(result, null, 2));
    return result;
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
