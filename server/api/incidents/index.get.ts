import { getDatabaseConnection } from "@/server/database/dbConnection";
import { listAnnotatedCollections } from "@/server/database/dbOperations";

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event);

    // Parse query parameters
    const filters = Object.fromEntries(
      Object.entries({
        collection_type: "incident", // Always filter for incidents
        status: query.status as string,
        created_by: query.created_by as string,
        limit: query.limit ? parseInt(query.limit as string) : 20,
        offset: query.offset ? parseInt(query.offset as string) : 0,
      }).filter(([_, value]) => value !== undefined),
    );

    const configDb = await getDatabaseConnection(true);
    if (!configDb) {
      throw createError({
        statusCode: 500,
        statusMessage: "Database connection failed",
      });
    }

    const result = await listAnnotatedCollections(configDb, filters);

    return {
      incidents: result.collections, // Return as 'incidents' for clarity
      total: result.total,
      limit: filters.limit,
      offset: filters.offset,
    };
  } catch (error) {
    console.error("Error fetching incidents:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Failed to fetch incidents",
    });
  }
});
