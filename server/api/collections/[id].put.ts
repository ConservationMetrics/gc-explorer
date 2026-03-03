import { handleUpdateCollection } from "@/server/utils/collectionHandlers";
import { validateUserSession } from "@/utils/auth";

export default defineEventHandler(async (event) => {
  await validateUserSession(event);
  const result = await handleUpdateCollection(event);
  return {
    collection: result,
  };
});
