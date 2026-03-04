import { useCompression } from "h3-compression";

/**
 * Compressible MIME type prefixes for API responses.
 * Covers JSON, CSV, GeoJSON, KML/XML, and plain text.
 */
export const COMPRESSIBLE_TYPES = [
  "application/json",
  "application/geo+json",
  "application/vnd.google-earth.kml+xml",
  "text/csv",
  "text/plain",
  "text/html",
  "text/xml",
  "application/xml",
];

/**
 * Minimum response size (in bytes) worth compressing.
 * Responses smaller than this threshold are sent uncompressed
 * because the compression overhead outweighs the savings.
 */
export const MIN_COMPRESSION_SIZE = 1024;

/**
 * Checks whether a Content-Type header value matches a compressible MIME type.
 *
 * @param {string | undefined} contentType - The Content-Type header value.
 * @returns {boolean} True if the response content type is compressible.
 */
export const isCompressible = (contentType: string | undefined): boolean => {
  if (!contentType) return false;
  return COMPRESSIBLE_TYPES.some((type) => contentType.includes(type));
};

/**
 * Nitro plugin that enables gzip/brotli/deflate compression for API responses.
 *
 * Uses h3-compression which automatically selects the best encoding based
 * on the client's Accept-Encoding header (preferring brotli > gzip > deflate).
 *
 * Only compresses responses that:
 * - Come from /api/ routes
 * - Have a compressible Content-Type
 * - Are larger than MIN_COMPRESSION_SIZE bytes
 */
export default defineNitroPlugin((nitro) => {
  nitro.hooks.hook("beforeResponse", async (event, response) => {
    const path = event.path || "";
    if (!path.startsWith("/api/")) return;

    const contentType = getResponseHeader(event, "content-type") as
      | string
      | undefined;
    if (!isCompressible(contentType)) return;

    const body = response.body;
    if (!body) return;

    const serialized = typeof body === "string" ? body : JSON.stringify(body);
    if (serialized.length < MIN_COMPRESSION_SIZE) return;

    await useCompression(event, response);
  });
});
