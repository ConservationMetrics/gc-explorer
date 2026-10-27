import { resolveFilebrowserShare } from "@/server/utils/filebrowserShare";
import { validatePermissions } from "@/utils/accessControls";

/** Read-only, opt-in proof of concept; does not update a view or serve files. */
export default defineEventHandler(async (event) => {
  await validatePermissions(event, "admin");
  const config = useRuntimeConfig(event).filebrowserResolution;
  if (String(config.enabled) !== "true")
    throw createError({ statusCode: 404, statusMessage: "Not found" });
  if (!config.origin || !config.username || !config.password) {
    throw createError({
      statusCode: 503,
      statusMessage: "Filebrowser resolution is not configured",
    });
  }
  const body = await readBody(event);
  if (!body || typeof body.shareUrl !== "string") {
    throw createError({
      statusCode: 400,
      statusMessage: "shareUrl is required",
    });
  }
  try {
    const result = await resolveFilebrowserShare(body.shareUrl, config);
    setHeader(event, "Cache-Control", "no-store");
    return { ...result, verified: false };
  } catch {
    // Do not expose upstream responses, credentials, or sensitive share metadata.
    throw createError({
      statusCode: 422,
      statusMessage:
        "Could not resolve Filebrowser share; check URL, credentials, permissions, and server configuration",
    });
  }
});
