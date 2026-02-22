import { fetchConfig, fetchRecords } from "@/server/database/dbOperations";
import { validatePermissions } from "@/utils/auth";

import type { H3Event } from "h3";

const MAX_IDS = 500;

export default defineEventHandler(async (event: H3Event) => {
  const { table } = event.context.params as { table: string };

  const body = await readBody(event);

  if (!body || !Array.isArray(body.ids)) {
    throw createError({
      statusCode: 400,
      statusMessage: "Request body must contain an 'ids' array",
    });
  }

  const { ids } = body as { ids: unknown[] };

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

  const stringIds = ids.filter(
    (id): id is string => typeof id === "string" && id.trim() !== "",
  );

  if (stringIds.length === 0) {
    throw createError({
      statusCode: 400,
      statusMessage: "The 'ids' array must contain valid string IDs",
    });
  }

  try {
    const viewsConfig = await fetchConfig();
    const permission = viewsConfig[table]?.ROUTE_LEVEL_PERMISSION ?? "member";
    await validatePermissions(event, permission);

    const records = await fetchRecords(table, stringIds);
    return records;
  } catch (error) {
    if (error instanceof Error && "statusCode" in error) {
      throw error;
    }
    console.error("Error fetching records:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Internal server error",
    });
  }
});
