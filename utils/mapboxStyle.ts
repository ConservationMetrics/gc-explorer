const MAPBOX_STYLE_PREFIX = "mapbox://styles/";
const MAPBOX_STUDIO_BASE = "https://console.mapbox.com/studio/";

/**
 * Converts a Mapbox style URL to a Mapbox Studio editor URL.
 *
 * Returns a Studio URL only when `style` is a string that starts with
 * `mapbox://styles/`. Style objects (inline StyleSpecification) and other
 * values return `null` so the UI can hide the link without crashing.
 *
 * @param {unknown} style - Mapbox style URL or inline style object.
 * @returns {string | null} Studio URL, or `null` when the style is not a Mapbox style URL.
 */
export const mapboxStyleToStudioUrl = (style: unknown): string | null => {
  if (typeof style !== "string" || !style.startsWith(MAPBOX_STYLE_PREFIX)) {
    return null;
  }

  return `${MAPBOX_STUDIO_BASE}${style.slice("mapbox://".length)}`;
};
