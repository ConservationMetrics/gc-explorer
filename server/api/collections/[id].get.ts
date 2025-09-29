import { getDatabaseConnection } from "@/server/database/dbConnection";
import { getAnnotatedCollection } from "@/server/database/dbOperations";

export default defineEventHandler(async (event) => {
  try {
    const collectionId = getRouterParam(event, "id");

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

    const result = await getAnnotatedCollection(configDb, collectionId);

    // Calculate statistics
    const statistics = {
      total_entries: result.entries.length,
      source_tables: [...new Set(result.entries.map((e) => e.source_table))],
      date_range: {
        start:
          result.entries.length > 0
            ? result.entries.reduce(
                (earliest, entry) =>
                  entry.added_at < earliest ? entry.added_at : earliest,
                result.entries[0].added_at,
              )
            : result.collection.created_at,
        end:
          result.entries.length > 0
            ? result.entries.reduce(
                (latest, entry) =>
                  entry.added_at > latest ? entry.added_at : latest,
                result.entries[0].added_at,
              )
            : result.collection.created_at,
      },
    };

    return {
      collection: result.collection,
      incident: result.incident,
      entries: result.entries,
      statistics,
    };
  } catch (error) {
    console.error("Error fetching collection:", error);
    if (error instanceof Error && error.message === "Collection not found") {
      throw createError({
        statusCode: 404,
        statusMessage: "Collection not found",
      });
    }
    throw createError({
      statusCode: 500,
      statusMessage: "Failed to fetch collection",
    });
  }
});
