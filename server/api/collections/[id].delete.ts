import { getDatabaseConnection } from "@/server/database/dbConnection";
import { deleteAnnotatedCollection } from "@/server/database/dbOperations";

export default defineEventHandler(async (event) => {
  try {
    const collectionId = getRouterParam(event, 'id');
    
    if (!collectionId) {
      throw createError({
        statusCode: 400,
        statusMessage: "Collection ID is required",
      });
    }

    const configDb = await getDatabaseConnection(true);
    if (!configDb) {
      throw createError({
        statusCode: 500,
        statusMessage: "Database connection failed",
      });
    }

    await deleteAnnotatedCollection(configDb, collectionId);
    
    return {
      success: true,
      message: "Collection deleted successfully",
    };
  } catch (error) {
    console.error("Error deleting collection:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Failed to delete collection",
    });
  }
});
