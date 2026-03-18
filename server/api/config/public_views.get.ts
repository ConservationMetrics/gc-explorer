import { fetchPublicViewTableNames } from "@/server/database/dbOperations";

/**
 * Open API: returns list of table names that are public (no auth required).
 * Used by middleware to allow unauthenticated access to public dataset routes.
 */
export default defineEventHandler(async () => {
  return await fetchPublicViewTableNames();
});
