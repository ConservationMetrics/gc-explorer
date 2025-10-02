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
  body.created_by = (session.user as { email: string }).email;

  return await handleCreateCollection(event);
});
