import { getDatabaseConnection } from "@/server/database/dbConnection";
import { addEntriesToCollection } from "@/server/database/dbOperations";

export default defineEventHandler(async (event) => {
  try {
    const collectionId = getRouterParam(event, 'id');
    const body = await readBody(event);
    
    if (!collectionId) {
      throw createError({
        statusCode: 400,
        statusMessage: "Collection ID is required",
      });
    }

    if (!body.entries || !Array.isArray(body.entries)) {
      throw createError({
        statusCode: 400,
        statusMessage: "Entries array is required",
      });
    }
    const session = await getUserSession(event);

    if (!session.user) {
      throw createError({
        statusCode: 401,
        statusMessage: "Unauthorized - Authentication required",
      });
    }
    console.log(session.user);

    const addedBy = session.user as {email: string};

    const configDb = await getDatabaseConnection(true);
    if (!configDb) {
      throw createError({
        statusCode: 500,
        statusMessage: "Database connection failed",
      });
    }

    const newEntries = await addEntriesToCollection(
      configDb,
      collectionId,
      body.entries,
      addedBy.email
    );
    
    return {
      entries: newEntries,
    };
  } catch (error) {
    console.error("Error adding entries to collection:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Failed to add entries to collection",
    });
  }
});
