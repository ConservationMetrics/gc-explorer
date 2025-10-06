import { getDatabaseConnection } from "@/server/database/dbConnection";
import { addNewTableToConfig } from "@/server/database/dbOperations";

import type { H3Event } from "h3";

export default defineEventHandler(async (event: H3Event) => {
  const table = event.context?.params?.table as string;
  try {
    const configDb = await getDatabaseConnection(true);

    await addNewTableToConfig(configDb, table);
    return { message: "New table added successfully" };
  } catch (error) {
    if (error instanceof Error) {
      console.error(
        "Error adding new table to config on API side:",
        error.message,
      );
      return sendError(event, new Error(error.message));
    } else {
      console.error(
        "Unknown error adding new table to config on API side:",
        error,
      );
      return sendError(event, new Error("An unknown error occurred"));
    }
  }
});
