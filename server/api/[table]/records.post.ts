import { fetchConfig, fetchRecordsByIds, BULK_RECORDS_MAX_IDS } from "@/server/database/dbOperations";
import { validatePermissions } from "@/utils/auth";

import type { H3Event } from "h3";
import type { DataEntry } from "@/types/types";

/**
 * POST api/[table]/records
 * Bulk fetch raw, untransformed records by _id. Request body: { ids: string[] }.
 * Returns { records: (DataEntry | null)[] } in the same order as requested ids (null for missing).
 * Rejects with 400 if ids missing, not an array, or length > BULK_RECORDS_MAX_IDS; 404 if table not in config.
 */
export default defineEventHandler(async (event: H3Event) => {
  const { table } = event.context.params as { table: string };

  const rawBody =
    (event as { body?: unknown }).body ??
    (await readBody(event).catch(() => null));
  const ids = rawBody && typeof rawBody === "object" && Array.isArray((rawBody as { ids?: unknown }).ids)
    ? ((rawBody as { ids: unknown[] }).ids).map((id) => String(id)).filter((id) => id.trim() !== "")
    : null;

  if (ids === null) {
    throw createError({
      statusCode: 400,
      statusMessage: "Request body must be { ids: string[] }",
    });
  }

  if (ids.length > BULK_RECORDS_MAX_IDS) {
    throw createError({
      statusCode: 400,
      statusMessage: `Too many IDs: maximum ${BULK_RECORDS_MAX_IDS} allowed`,
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

  const records = await fetchRecordsByIds(table, ids);
  return { records };
});
