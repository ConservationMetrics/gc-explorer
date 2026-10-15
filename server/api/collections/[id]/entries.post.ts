import { handleAddEntriesToCollection } from "@/server/annotatedCollections/handlers";
import type { User } from "@/types";
import { validatePermissions } from "@/utils/accessControls";

export default defineEventHandler(async (event) => {
  await validatePermissions(event, "member");
  const session = await getUserSession(event);

  // Add user info to the request body
  const body = await readBody(event);
  if (session.user) {
    body.added_by = (session.user as User).auth0;
  }

  return await handleAddEntriesToCollection(event);
});
