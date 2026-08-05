const DEFAULT_MAPBOX_STYLE = "mapbox/satellite-streets-v12";
const MINIMAP_PIN_COLOR = "7c3aed";

/**
 * Converts a Mapbox style URL to the Static Images API style path.
 *
 * @param {string | undefined} style - Mapbox style URL or path.
 * @returns {string} Static API style path.
 */
export const mapboxStyleToStaticPath = (style?: string): string => {
  if (!style) return DEFAULT_MAPBOX_STYLE;

  const stylePrefix = "mapbox://styles/";
  if (style.startsWith(stylePrefix)) {
    return style.slice(stylePrefix.length);
  }

  return style;
};

/**
 * Parses a `"lat, lng"` centroid string into numeric coordinates.
 *
 * @param {string} centroid - Centroid string from geo utils.
 * @returns {{ lat: number; lng: number } | null} Parsed coordinates or null.
 */
export const parseCentroidLatLng = (
  centroid: string,
): { lat: number; lng: number } | null => {
  const parts = centroid.split(",").map((part) => part.trim());
  if (parts.length !== 2) return null;

  const lat = parseFloat(parts[0]);
  const lng = parseFloat(parts[1]);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

  return { lat, lng };
};

/**
 * Builds a Mapbox Static Images API URL for a detail minimap.
 *
 * @param {object} options - URL builder options.
 * @param {string} options.accessToken - Mapbox access token.
 * @param {string} options.centroid - `"lat, lng"` centroid string.
 * @param {string} [options.mapboxStyle] - Mapbox style URL or path.
 * @param {number} [options.width] - Image width in pixels.
 * @param {number} [options.height] - Image height in pixels.
 * @param {number} [options.zoom] - Map zoom level.
 * @returns {string | null} Static image URL, or null when inputs are invalid.
 */
export const buildMinimapUrl = ({
  accessToken,
  centroid,
  mapboxStyle,
  width = 600,
  height = 300,
  zoom = 14,
}: {
  accessToken: string;
  centroid: string;
  mapboxStyle?: string;
  width?: number;
  height?: number;
  zoom?: number;
}): string | null => {
  if (!accessToken.trim()) return null;

  const coordinates = parseCentroidLatLng(centroid);
  if (!coordinates) return null;

  const stylePath = mapboxStyleToStaticPath(mapboxStyle);
  const { lng, lat } = coordinates;
  const overlay = `pin-s+${MINIMAP_PIN_COLOR}(${lng},${lat})`;
  const position = `${lng},${lat},${zoom}`;
  const size = `${width}x${height}@2x`;

  return `https://api.mapbox.com/styles/v1/${stylePath}/static/${overlay}/${position}/${size}?access_token=${encodeURIComponent(accessToken)}`;
};
