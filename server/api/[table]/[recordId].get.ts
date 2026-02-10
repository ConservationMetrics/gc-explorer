import { fetchConfig, fetchRecordById } from "@/server/database/dbOperations";
import { validatePermissions } from "@/utils/auth";

import type { H3Event } from "h3";

/**
 * GET api/[table]/[recordId]
 * Returns the raw, untransformed record for the given _id.
 * Used on demand when the user selects a feature (e.g. map click).
 * Returns 404 if the table is not in config or the record is missing.
 */
export default defineEventHandler(async (event: H3Event) => {
  const { table, recordId } = event.context.params as {
    table: string;
    recordId: string;
  };

  if (!recordId || typeof recordId !== "string" || recordId.trim() === "") {
    throw createError({
      statusCode: 400,
      statusMessage: "recordId is required",
    });
  }

  const viewsConfig = await fetchConfig();
  const permission = viewsConfig[table]?.ROUTE_LEVEL_PERMISSION ?? "member";
  await validatePermissions(event, permission);

  if (!viewsConfig[table]) {
    throw createError({
      statusCode: 404,
      statusMessage: "Table config not found",
    });
  }

  const record = await fetchRecordById(table, recordId.trim());
  if (!record) {
    throw createError({
      statusCode: 404,
      statusMessage: "Record not found",
    });
  }

  return record;
});
