import { handleListCollections } from "@/server/utils/collectionHandlers";
import { validateUserSession } from "@/utils/auth";

export default defineEventHandler(async (event) => {
  await validateUserSession(event);
  const result = await handleListCollections(event, "incident");

  // Transform the response to use 'incidents' instead of 'collections'
  return {
    incidents: result.collections,
    total: result.total,
    limit: result.limit,
    offset: result.offset,
  };
});
