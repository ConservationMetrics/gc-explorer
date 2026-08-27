import { handleDeleteCollection } from "@/server/annotatedCollections/handlers";
import { validatePermissions } from "@/utils/accessControls";

export default defineEventHandler(async (event) => {
  await validatePermissions(event, "member");
  const result = await handleDeleteCollection(event);
  return {
    ...result,
    message: "Collection deleted successfully",
  };
});
