import { handleListCollections } from "@/server/annotatedCollections/handlers";
import { validatePermissions } from "@/utils/accessControls";

export default defineEventHandler(async (event) => {
  await validatePermissions(event, "member");
  const result = await handleListCollections(event, "incident");

  // Transform the response to use 'incidents' instead of 'collections'
  return {
    incidents: result.collections,
    total: result.total,
    limit: result.limit,
    offset: result.offset,
  };
});
