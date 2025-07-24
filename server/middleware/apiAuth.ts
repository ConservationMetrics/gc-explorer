import { createError, eventHandler } from "h3";
import { useRuntimeConfig } from "#imports";

export default eventHandler((event) => {
  const {
    public: { appApiKey },
  } = useRuntimeConfig();
  const url = event.node.req.url;

  if (!url) {
    return;
  }
  if (!url.startsWith("/api/")) {
    return;
  }
  if (
    url.startsWith("/api/map") ||
    url.startsWith("/api/_auth/") ||
    url.startsWith("/api/auth/auth0")
  ) {
    return;
  }

  const requestApiKey = event.node.req.headers["x-api-key"];

  if (requestApiKey !== appApiKey) {
    throw createError({
      status: 403,
      message: "Forbidden",
    });
  }
});
