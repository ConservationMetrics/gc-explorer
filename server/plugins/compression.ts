import { brotliCompressSync, gzipSync } from "node:zlib";

/**
 * Nitro plugin that enables brotli/gzip compression for responses.
 *
 * Reads the client's Accept-Encoding header and compresses the
 * serialized response body, preferring brotli over gzip. Uses
 * Node.js built-in zlib instead of h3-compression because that
 * library only supports plaintext/HTML — it silently skips JSON
 * API responses in the beforeResponse hook.
 *
 * @see https://github.com/CodeDredd/h3-compression/issues/8
 * @see https://github.com/ConservationMetrics/gc-explorer/pull/355#issuecomment-2700637498
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
