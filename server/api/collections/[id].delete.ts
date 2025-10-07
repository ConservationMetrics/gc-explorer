import { handleDeleteCollection } from "@/server/utils/collectionHandlers";

export default defineEventHandler(async (event) => {
  const result = await handleDeleteCollection(event);
  return {
    ...result,
    message: "Collection deleted successfully",
  };
});
