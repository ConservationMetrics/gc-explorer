import { handleCreateCollection } from "@/server/utils/collectionHandlers";
import { validateUserSession } from "@/utils/auth";

export default defineEventHandler(async (event) => {
  // Get user session for authentication
  const session = await validateUserSession(event);

  // Add user info to the request body
  const body = await readBody(event);
  if (session.user) {
    body.created_by = (session.user as { email: string }).email;
  }

  return await handleCreateCollection(event);
});
