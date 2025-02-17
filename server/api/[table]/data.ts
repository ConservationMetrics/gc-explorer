import type { H3Event } from "h3";
import { defineEventHandler, sendError } from "h3";
import { getDatabaseConnection } from "@/server/database/dbConnection";
import { fetchData } from "../../database/dbOperations";

export default defineEventHandler(async (event: H3Event) => {
  const { table } = event.context.params as { table: string };

  const { isSqlite } = useRuntimeConfig() as unknown as {
    isSqlite: boolean;
  };

  try {
    const db = await getDatabaseConnection(false);

    const { mainData, columnsData } = await fetchData(db, table, isSqlite);
    return { data: mainData, columns: columnsData };
  } catch (error) {
    if (error instanceof Error) {
      console.error("Error fetching data on API side:", error.message);
      return sendError(event, new Error(error.message));
    } else {
      console.error("Unknown error fetching data on API side:", error);
      return sendError(event, new Error("An unknown error occurred"));
    }
  }
});
