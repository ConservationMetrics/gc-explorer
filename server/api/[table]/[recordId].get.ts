import { sql } from "drizzle-orm";
import { fetchConfig } from "@/server/database/dbOperations";
import { warehouseDb } from "@/server/utils/db";
import { validatePermissions } from "@/utils/auth";

import type { H3Event } from "h3";
import type { DataEntry } from "@/types/types";

/**
 * GET /api/[table]/[recordId]
 *
 * Fetches a single raw record by its _id from the specified warehouse table.
 * Returns the record exactly as stored in the database - no transformations.
 *
 * This endpoint is called on-demand (e.g., when a user clicks a feature on the map)
 * rather than preloading all records on page load.
 */
export default defineEventHandler(async (event: H3Event) => {
  const { table, recordId } = event.context.params as {
    table: string;
    recordId: string;
  };

  if (!recordId || typeof recordId !== "string" || recordId.trim() === "") {
    throw createError({
      statusCode: 400,
      statusMessage: "Bad Request",
      message: "recordId parameter is required and must be a non-empty string",
    });
  }

  if (!table || !/^[a-zA-Z0-9_]+$/.test(table)) {
    throw createError({
      statusCode: 400,
      statusMessage: "Bad Request",
      message: "Invalid table name",
    });
  }

  try {
    const viewsConfig = await fetchConfig();

    if (!viewsConfig[table]) {
      throw createError({
        statusCode: 404,
        statusMessage: "Not Found",
        message: `Table '${table}' not found in configuration`,
      });
    }

    const permission = viewsConfig[table]?.ROUTE_LEVEL_PERMISSION ?? "member";
    await validatePermissions(event, permission);

    const result = await warehouseDb.execute(sql`
      SELECT * FROM ${sql.identifier(table)} WHERE _id = ${recordId} LIMIT 1
    `);

    if (!result || result.length === 0) {
      throw createError({
        statusCode: 404,
        statusMessage: "Not Found",
        message: `Record with _id '${recordId}' not found in table '${table}'`,
      });
    }

    return result[0] as DataEntry;
  } catch (error) {
    if (error && typeof error === "object" && "statusCode" in error) {
      throw error;
    }
    console.error("Error fetching record:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Internal Server Error",
      message:
        error instanceof Error ? error.message : "An unknown error occurred",
    });
  }
});
