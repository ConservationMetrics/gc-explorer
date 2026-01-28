import { handleCreateCollection } from "@/server/utils/collectionHandlers";
import { useRuntimeConfig } from "#imports";

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  const authStrategy = config.public.authStrategy as string | undefined;

  // Get user session for authentication
  const session = await getUserSession(event);

  // Only require authentication if authStrategy is not "none"
  if (authStrategy !== "none" && !session.user) {
    throw createError({
      statusCode: 401,
      statusMessage: "Unauthorized - Authentication required",
    });
  }

  // Add user info to the request body only if auth0 is available
  const body = await readBody(event);
  if (session.user) {
    const user = session.user as {
      auth0?: string;
      [key: string]: unknown;
    };
    // Only set created_by if auth0 field exists and is not empty (user is authenticated via auth0)
    if (user.auth0 && user.auth0.trim() !== "") {
      body.created_by = user.auth0;
    }
  }
  // Ensure created_by is undefined (not empty string) if not set
  // This prevents empty strings from being stored in the database
  if (body.created_by === "" || body.created_by === null) {
    delete body.created_by;
  }
  // If authStrategy is "none" or user.auth0 is not available, created_by will be undefined
  // and handleCreateCollection will handle it appropriately

  const result = await handleCreateCollection(event, "incident");

  // Transform the response to use 'incident' instead of 'collection'
  return {
    incident: result,
  };
});
