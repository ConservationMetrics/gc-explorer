import { defineEventHandler, sendError, H3Event } from "h3";
import { getDatabaseConnection } from "@/server/database/dbConnection";
import { addNewTableToConfig } from "../../../database/dbOperations";

export default defineEventHandler(async (event: H3Event) => {
  const {
    isSqlite,
    // eslint-disable-next-line no-undef
  } = useRuntimeConfig() as unknown as {
    isSqlite: boolean;
  };

  const table = event.context?.params?.table as string;
  try {
    const configDb = await getDatabaseConnection(true);

    await addNewTableToConfig(configDb, table, isSqlite);
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
