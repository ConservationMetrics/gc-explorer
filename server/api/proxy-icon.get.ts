/**
 * Proxy endpoint for loading map icons from external sources (e.g., Filebrowser)
 * This solves CORS issues when Mapbox tries to load images via Canvas API
 */
export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const url = query.url as string;

  if (!url) {
    throw createError({
      statusCode: 400,
      statusMessage: "Missing 'url' query parameter",
    });
  }

  try {
    // Fetch the image from the external source
    const response = await fetch(url);
    
    if (!response.ok) {
      throw createError({
        statusCode: response.status,
        statusMessage: `Failed to fetch image: ${response.statusText}`,
      });
    }

    // Get the image data
    const imageBuffer = await response.arrayBuffer();
    const contentType = response.headers.get("content-type") || "image/png";

    // Set proper headers including CORS
    setHeaders(event, {
      "Content-Type": contentType,
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "public, max-age=86400", // Cache for 24 hours
    });

    // Return the image data
    return new Uint8Array(imageBuffer);
  } catch (error) {
    throw createError({
      statusCode: 500,
      statusMessage: "Failed to proxy image",
    });
  }
});

