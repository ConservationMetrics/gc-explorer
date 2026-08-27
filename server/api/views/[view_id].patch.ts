import { updateView } from "@/server/database/dbOperations";
import { parseUpdateViewBody, parseViewId } from "@/server/utils/viewApi";
import { validatePermissions } from "@/utils/accessControls";

import type { H3Event } from "h3";

export default defineEventHandler(async (event: H3Event) => {
  await validatePermissions(event, "admin");
  const viewId = parseViewId(event);
  const body = parseUpdateViewBody(await readBody(event));
  return await updateView(viewId, body);
});
