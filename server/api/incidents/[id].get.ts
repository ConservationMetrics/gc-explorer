import { handleGetCollection } from "@/server/annotatedCollections/handlers";
import { validateUserSession } from "@/utils/accessControls";

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
