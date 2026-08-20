const MAPBOX_STYLE_PREFIX = "mapbox://styles/";
const MAPBOX_STUDIO_BASE = "https://console.mapbox.com/studio/";

/**
 * Converts a Mapbox style URL to a Mapbox Studio editor URL.
 *
 * Returns a Studio URL only when `style` starts with `mapbox://styles/`.
 * Otherwise returns `null` so the UI can hide the link.
 *
 * @param {string} style - Mapbox style URL (e.g. `mapbox://styles/mapbox/streets-v12`).
 * @returns {string | null} Studio URL, or `null` when the style is not a Mapbox style URL.
 */
export const mapboxStyleToStudioUrl = (style: string): string | null => {
  if (!style.startsWith(MAPBOX_STYLE_PREFIX)) {
    return null;
  }

  return `${MAPBOX_STUDIO_BASE}${style.slice("mapbox://".length)}`;
};
