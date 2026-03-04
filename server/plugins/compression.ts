import { brotliCompressSync, gzipSync } from "node:zlib";

/**
 * Nitro plugin that enables brotli/gzip compression for responses.
 *
 * Reads the client's Accept-Encoding header and compresses the
 * serialized response body, preferring brotli over gzip. Nuxt
 * internal routes are skipped since those assets are already
 * pre-compressed at build time via compressPublicAssets.
 *
 * @see https://nitro.build/guide/plugins
 */
export default defineNitroPlugin((nitro) => {
  nitro.hooks.hook("beforeResponse", async (event, response) => {
    const path = event.path || "";
    if (path.startsWith("/_nuxt") || path.startsWith("/__nuxt")) return;

    if (!response.body) return;

    const acceptEncoding = getRequestHeader(event, "accept-encoding") || "";

    const serialized =
      typeof response.body === "string"
        ? response.body
        : JSON.stringify(response.body);

    if (acceptEncoding.includes("br")) {
      response.body = brotliCompressSync(Buffer.from(serialized));
      setResponseHeader(event, "content-encoding", "br");
      setResponseHeader(event, "vary", "Accept-Encoding");
      removeResponseHeader(event, "content-length");
    } else if (acceptEncoding.includes("gzip")) {
      response.body = gzipSync(Buffer.from(serialized));
      setResponseHeader(event, "content-encoding", "gzip");
      setResponseHeader(event, "vary", "Accept-Encoding");
      removeResponseHeader(event, "content-length");
    }
  });
});
