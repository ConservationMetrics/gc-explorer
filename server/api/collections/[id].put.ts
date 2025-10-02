import { handleUpdateCollection } from "@/server/utils/collectionHandlers";

export default defineEventHandler(async (event) => {
  const result = await handleUpdateCollection(event);
  return {
    collection: result,
  };
});
