import { handleUpdateCollection } from "@/server/annotatedCollections/handlers";
import { validateUserSession } from "@/utils/accessControls";

export default defineEventHandler(async (event) => {
  await validateUserSession(event);
  const result = await handleUpdateCollection(event);
  return {
    collection: result,
  };
});
