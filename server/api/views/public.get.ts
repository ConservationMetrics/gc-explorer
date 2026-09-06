import { fetchPublicViews } from "@/server/database/dbOperations";

export default defineEventHandler(async () => {
  return await fetchPublicViews();
});
