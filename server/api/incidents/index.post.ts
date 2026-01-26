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
  // Use auth0 email for created_by (auth0 field contains the user's email)
  const user = session.user as {
    auth0: string;
    [key: string]: unknown;
  };
  body.created_by = user.auth0;

  const result = await handleCreateCollection(event, "incident");

  // Transform the response to use 'incident' instead of 'collection'
  return {
    incident: result,
  };
});
