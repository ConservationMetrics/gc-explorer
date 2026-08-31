import { handleUpdateCollection } from "@/server/annotatedCollections/handlers";
import { validatePermissions } from "@/utils/accessControls";

export default defineEventHandler(async (event) => {
  await validatePermissions(event, "member");
  const result = await handleUpdateCollection(event);
  return {
    collection: result,
  };
});
