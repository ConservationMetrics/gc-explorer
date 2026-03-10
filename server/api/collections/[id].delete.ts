import { handleDeleteCollection } from "@/server/annotatedCollections/handlers";
import { validateUserSession } from "@/utils/accessControls";

export default defineEventHandler(async (event) => {
  await validateUserSession(event);
  const result = await handleDeleteCollection(event);
  return {
    ...result,
    message: "Collection deleted successfully",
  };
});
