import { handleGetCollection } from "@/server/utils/collectionHandlers";

export default defineEventHandler(async (event) => {
  const result = await handleGetCollection(event);

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
});
