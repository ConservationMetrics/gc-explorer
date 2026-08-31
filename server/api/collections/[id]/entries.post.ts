import { handleAddEntriesToCollection } from "@/server/annotatedCollections/handlers";
import { validatePermissions } from "@/utils/accessControls";

export default defineEventHandler(async (event) => {
  await validatePermissions(event, "member");
  const session = await getUserSession(event);

  // Add user info to the request body
  const body = await readBody(event);
  if (session.user) {
    body.added_by = (session.user as { email: string }).email;
  }

  return await handleAddEntriesToCollection(event);
});
