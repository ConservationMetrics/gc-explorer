import { handleListCollections } from "@/server/utils/collectionHandlers";
import { validateUserSession } from "@/utils/auth";

export default defineEventHandler(async (event) => {
  await validateUserSession(event);
  return await handleListCollections(event);
});
