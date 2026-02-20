import { fetchConfig, fetchRecord } from "@/server/database/dbOperations";
import { validatePermissions } from "@/utils/auth";

import type { H3Event } from "h3";

export default defineEventHandler(async (event: H3Event) => {
  const { table, recordId } = event.context.params as {
    table: string;
    recordId: string;
  };

  if (!recordId || typeof recordId !== "string" || recordId.trim() === "") {
    throw createError({ statusCode: 400, statusMessage: "Invalid record ID" });
  }

  try {
    const viewsConfig = await fetchConfig();

    // Check visibility permissions
    const permission = viewsConfig[table]?.ROUTE_LEVEL_PERMISSION ?? "member";

    // Validate user authentication and permissions
    await validatePermissions(event, permission);

    const record = await fetchRecord(table, recordId);

    if (!record) {
      throw createError({
        statusCode: 404,
        statusMessage: "Record not found",
      });
    }

    return record;
  } catch (error) {
    if (error instanceof Error && "statusCode" in error) {
      throw error;
    }
    console.error("Error fetching record:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Internal server error",
    });
  }
});
