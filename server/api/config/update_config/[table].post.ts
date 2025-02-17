import type { H3Event } from "h3";
import { defineEventHandler, sendError, readBody } from "h3";
import { getDatabaseConnection } from "@/server/database/dbConnection";
import { updateConfig } from "../../../database/dbOperations";

export default defineEventHandler(async (event: H3Event) => {
  const table = event.context?.params?.table as string;
  const config = await readBody(event);

  try {
    const configDb = await getDatabaseConnection(true);

    await updateConfig(configDb, table, config);
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
