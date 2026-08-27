import { fetchPublicViews } from "@/server/database/dbOperations";

/**
 * Open API: returns stable identities for public views (no auth required).
 * Used by middleware to allow unauthenticated access to public dataset routes.
 */
export default defineEventHandler(async () => {
  return await fetchPublicViews();
});
