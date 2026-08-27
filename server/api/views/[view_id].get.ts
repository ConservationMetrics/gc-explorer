import { fetchViewConfigRow } from "@/server/database/dbOperations";
import { parseViewId } from "@/server/utils/viewApi";
import { validateUserSession } from "@/utils/accessControls";

import type { H3Event } from "h3";

export default defineEventHandler(async (event: H3Event) => {
  await validateUserSession(event);
  return await fetchViewConfigRow(parseViewId(event));
});
