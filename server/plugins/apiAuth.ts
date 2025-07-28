import type { NitroApp } from "nitropack";
import type { H3Event } from "h3";
import apiAuthMiddleware from "../middleware/apiAuth";

export default defineNitroPlugin((nitroApp: NitroApp) => {
  nitroApp.hooks.hook("request", (event: H3Event) => {
    // Apply API auth middleware to all requests
    return apiAuthMiddleware(event);
  });
});
