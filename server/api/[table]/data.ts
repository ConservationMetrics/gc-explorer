import { fetchData } from "@/server/database/dbOperations";

import type { H3Event } from "h3";

export default defineEventHandler(async (event: H3Event) => {
  const { table } = event.context.params as { table: string };

  try {

    const { mainData, columnsData } = await fetchData(table);
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
