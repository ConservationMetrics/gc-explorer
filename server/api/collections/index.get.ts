import { handleListCollections } from "@/server/utils/collectionHandlers";

export default defineEventHandler(async (event) => {
  return await handleListCollections(event);
});
