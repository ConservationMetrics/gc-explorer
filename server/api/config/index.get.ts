import { defineEventHandler, sendError, H3Event } from "h3";
import { getDatabaseConnection } from "@/server/database/dbConnection";
import { fetchConfig } from "@/server/database/dbOperations";
import { getFilteredTableNames } from "./utils";

export default defineEventHandler(async (event: H3Event) => {
  const {
    isSqlite,
    // eslint-disable-next-line no-undef
  } = useRuntimeConfig() as unknown as {
    isSqlite: boolean;
  };

  try {
    const configDb = await getDatabaseConnection(true);
    const db = await getDatabaseConnection(false);

    const viewsConfig = await fetchConfig(configDb, isSqlite);
    const tableNames = await getFilteredTableNames(db, isSqlite);

    // Filter out any tables that are already in viewsConfig
    const filteredTableNames = tableNames.filter(
      (name) => !Object.keys(viewsConfig).includes(name),
    );

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
