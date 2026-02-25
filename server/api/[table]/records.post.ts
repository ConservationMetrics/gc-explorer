import { fetchConfig, fetchRecords } from "@/server/database/dbOperations";
import { validatePermissions } from "@/utils/auth";

import type { H3Event } from "h3";

const MAX_IDS = 500;
/** NOTE: The endpoint does not guarantee that records are returned in the same order as requested IDs. Consumers must not rely on response ordering. */
export default defineEventHandler(async (event: H3Event) => {
  const { table } = event.context.params as { table: string };

  const body = await readBody(event);

  if (!body || !Array.isArray(body.ids)) {
    throw createError({
      statusCode: 400,
      statusMessage: "Request body must contain an 'ids' array",
    });
  }

  const { ids } = body as { ids: Array<string> };

  if (ids.length === 0) {
    throw createError({
      statusCode: 400,
      statusMessage: "The 'ids' array must not be empty",
    });
  }

  if (ids.length > MAX_IDS) {
    throw createError({
      statusCode: 400,
      statusMessage: `Too many IDs requested. Maximum is ${MAX_IDS}, received ${ids.length}`,
    });
  }

  try {
    const viewsConfig = await fetchConfig();
    const permission = viewsConfig[table]?.ROUTE_LEVEL_PERMISSION ?? "member";
    await validatePermissions(event, permission);

    const records = await fetchRecords(table, ids);
    return records;
  } catch (error) {
    if (error instanceof Error) {
      console.error("Error fetching records:", error);
      return sendError(event, error);
    } else {
      console.error("Unknown error fetching records:", error);
      return sendError(event, new Error("An unknown error occurred"));
    }
  }
});
