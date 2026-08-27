import { createView } from "@/server/database/dbOperations";
import { parseCreateViewBody } from "@/server/utils/viewApi";
import { validatePermissions } from "@/utils/accessControls";

import type { H3Event } from "h3";

export default defineEventHandler(async (event: H3Event) => {
  await validatePermissions(event, "admin");
  const body = parseCreateViewBody(await readBody(event));
  const view = await createView(body);
  setResponseStatus(event, 201);
  return view;
});
