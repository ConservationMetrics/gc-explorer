import { brotliCompressSync, gzipSync } from "node:zlib";

const COMPRESSIBLE_TYPES = [
  "text/",
  "application/json",
  "application/javascript",
  "application/x-javascript",
  "application/xml",
  "image/svg+xml",
];

/**
 * Nitro plugin that enables brotli/gzip compression for text-like responses.
 *
 * Reads the client's Accept-Encoding header and compresses the
 * serialized response body, preferring brotli over gzip. Uses
 * Node.js built-in zlib instead of h3-compression because that
 * library only supports plaintext/HTML — it silently skips JSON
 * API responses in the beforeResponse hook.
 *
 * Binary responses (images, fonts, etc.) are left untouched — compressing
 * them via JSON.stringify corrupts the payload.
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

    const contentType =
      (getResponseHeader(event, "content-type") as string) || "";
    if (!COMPRESSIBLE_TYPES.some((t) => contentType.includes(t))) return;

    const acceptEncoding = getRequestHeader(event, "accept-encoding") || "";

    const body =
      typeof response.body === "string"
        ? Buffer.from(response.body)
        : Buffer.isBuffer(response.body)
          ? response.body
          : Buffer.from(JSON.stringify(response.body));

    if (acceptEncoding.includes("br")) {
      response.body = brotliCompressSync(body);
      setResponseHeader(event, "content-encoding", "br");
      setResponseHeader(event, "vary", "Accept-Encoding");
      removeResponseHeader(event, "content-length");
    } else if (acceptEncoding.includes("gzip")) {
      response.body = gzipSync(body);
      setResponseHeader(event, "content-encoding", "gzip");
      setResponseHeader(event, "vary", "Accept-Encoding");
      removeResponseHeader(event, "content-length");
    }
  });
});
