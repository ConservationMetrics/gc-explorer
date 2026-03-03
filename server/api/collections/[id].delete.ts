import { handleDeleteCollection } from "@/server/utils/collectionHandlers";
import { validateUserSession } from "@/utils/auth";

export default defineEventHandler(async (event) => {
  await validateUserSession(event);
  const result = await handleDeleteCollection(event);
  return {
    ...result,
    message: "Collection deleted successfully",
  };
});
