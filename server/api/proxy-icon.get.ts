import { inferContentType } from "@/utils/mediaHelpers";

/**
 * Proxy endpoint for loading map icons from external sources (e.g., Filebrowser).
 * Solves CORS issues when Mapbox tries to load images via the Canvas API and
 * normalizes Content-Type (see {@link inferContentType}).
 */
export default defineEventHandler(async (event) => {
  const url = getQuery(event).url as string | undefined;

  if (!url) {
    throw createError({
      statusCode: 400,
      statusMessage: "Missing 'url' query parameter",
    });
  }

  const response = await fetch(url);
  if (!response.ok) {
    throw createError({
      statusCode: response.status,
      statusMessage: `Failed to fetch image: ${response.statusText}`,
    });
  }

  setHeaders(event, {
    "Content-Type": inferContentType(url, response.headers.get("content-type")),
    "Access-Control-Allow-Origin": "*",
    "Cache-Control": "public, max-age=86400",
  });

  return new Uint8Array(await response.arrayBuffer());
});
