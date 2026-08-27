import { deleteView } from "@/server/database/dbOperations";
import { parseViewId } from "@/server/utils/viewApi";
import { validatePermissions } from "@/utils/accessControls";

import type { H3Event } from "h3";

export default defineEventHandler(async (event: H3Event) => {
  await validatePermissions(event, "admin");
  await deleteView(parseViewId(event));
  setResponseStatus(event, 204);
});
