import { fetchViewConfigRows } from "@/server/database/dbOperations";
import { validateUserSession } from "@/utils/accessControls";

import type { H3Event } from "h3";

export default defineEventHandler(async (event: H3Event) => {
  await validateUserSession(event);
  const primaryDataset = getQuery(event).primary_dataset;

  if (
    primaryDataset !== undefined &&
    (typeof primaryDataset !== "string" || primaryDataset.trim() === "")
  ) {
    throw createError({
      statusCode: 400,
      statusMessage: "primary_dataset must be a single non-empty value",
    });
  }

  return await fetchViewConfigRows(primaryDataset);
});
