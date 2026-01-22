import { handleCreateCollection } from "@/server/utils/collectionHandlers";

export default defineEventHandler(async (event) => {
  // Get user session for authentication
  const session = await getUserSession(event);
  if (!session.user) {
    throw createError({
      statusCode: 401,
      statusMessage: "Unauthorized - Authentication required",
    });
  }

  // Add user info to the request body
  const body = await readBody(event);
  // Use user's name/nickname from auth0 if available, otherwise fall back to email
  // The session user object may have additional auth0 fields like name or nickname
  const user = session.user as {
    email: string;
    name?: string;
    nickname?: string;
    [key: string]: unknown;
  };
  body.created_by = (user.name || user.nickname || user.email) as string;

  const result = await handleCreateCollection(event, "incident");

  // Transform the response to use 'incident' instead of 'collection'
  return {
    incident: result,
  };
});
