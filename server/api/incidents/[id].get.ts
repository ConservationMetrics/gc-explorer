import { handleGetCollection } from "@/server/utils/collectionHandlers";
import { validateUserSession } from "@/utils/auth";

export default defineEventHandler(async (event) => {
  await validateUserSession(event);
  const result = await handleGetCollection(event);

  // Transform the response to use incident naming
  return {
    incident: result.collection,
    incidentData: result.incident,
    entries: result.entries,
  };
});
