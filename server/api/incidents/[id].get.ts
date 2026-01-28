import { handleGetCollection } from "@/server/utils/collectionHandlers";

export default defineEventHandler(async (event) => {
  const result = await handleGetCollection(event);

  // Transform the response to use incident naming
  return {
    incident: result.collection,
    incidentData: result.incident,
    entries: result.entries,
  };
});
