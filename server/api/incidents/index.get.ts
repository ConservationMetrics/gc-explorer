import { handleListCollections } from "@/server/utils/collectionHandlers";

export default defineEventHandler(async (event) => {
  const result = await handleListCollections(event, "incident");

  // Transform the response to use 'incidents' instead of 'collections'
  return {
    incidents: result.collections,
    total: result.total,
    limit: result.limit,
    offset: result.offset,
  };
});
