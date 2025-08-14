import { createError, eventHandler } from "h3";
import { useRuntimeConfig } from "#imports";

export default eventHandler((event) => {
  const {
    public: { appApiKey },
  } = useRuntimeConfig();
  const url = event.node.req.url;
  const method = event.node.req.method;

  if (!url) {
    return;
  }
  if (!url.startsWith("/api/")) {
    return;
  }
  if (
    url.startsWith("/api/map") ||
    url.startsWith("/api/_auth/") ||
    url.startsWith("/api/auth/auth0") ||
    url.startsWith("/api/roles")
  ) {
    return;
  }

  // Allow OPTIONS requests (CORS preflight) to pass through
  if (method === "OPTIONS") {
    console.log("🔍 Allowing OPTIONS request for CORS preflight");
    event.node.res.statusCode = 204;
    event.node.res.end();
  }

  const requestApiKey = event.node.req.headers["x-api-key"];
  if (requestApiKey !== appApiKey) {
    throw createError({
      status: 403,
      message: "Forbidden",
    });
  }
});
