import type { Map as MapboxMap } from "mapbox-gl";
import type { RouteLocationNormalizedLoaded, Router } from "vue-router";

import type { MapCamera, MapCameraQuery } from "@/types";
import { MAP_FEATURE_ID_QUERY_KEYS } from "@/types";

const LAT_DECIMALS = 5;
const LNG_DECIMALS = 5;
const ZOOM_DECIMALS = 2;
const MIN_LAT = -90;
const MAX_LAT = 90;
const MIN_LNG = -180;
const MAX_LNG = 180;
const MIN_ZOOM = 0;
const MAX_ZOOM = 24;

/**
 * Reads a single finite number from a route query value.
 *
 * @param value - Raw query value
 * @returns The parsed number, or null when the value is missing or invalid
 */
const parseQueryNumber = (value: unknown): number | null => {
  if (typeof value !== "string" || value.trim() === "") {
    return null;
  }
  const parsed = parseFloat(value);
  if (!Number.isFinite(parsed)) {
    return null;
  }
  return parsed;
};

/**
 * Returns true when a query value is a non-empty feature id string.
 *
 * @param value - Raw query value
 * @returns True when the value can identify a feature
 */
const isFeatureIdQueryValue = (value: unknown): boolean => {
  return typeof value === "string" && value.trim() !== "";
};

/**
 * Returns true when the URL has an alert, incident, map, or secondary feature id.
 *
 * @param query - Current route query
 * @returns True when a feature id is present
 */
export const hasMapFeatureIdQuery = (
  query: Record<string, unknown>,
): boolean => {
  return MAP_FEATURE_ID_QUERY_KEYS.some((key) =>
    isFeatureIdQueryValue(query[key]),
  );
};

/**
 * Parses `lat`, `lng`, and `zoom` from a route query.
 *
 * @param query - Current route query
 * @returns A camera when all three values are valid, otherwise null
 */
export const parseMapCameraQuery = (
  query: Record<string, unknown>,
): MapCamera | null => {
  const lat = parseQueryNumber(query.lat);
  const lng = parseQueryNumber(query.lng);
  const zoom = parseQueryNumber(query.zoom);
  if (lat === null || lng === null || zoom === null) {
    return null;
  }
  if (lat < MIN_LAT || lat > MAX_LAT) {
    return null;
  }
  if (lng < MIN_LNG || lng > MAX_LNG) {
    return null;
  }
  if (zoom < MIN_ZOOM || zoom > MAX_ZOOM) {
    return null;
  }
  return { lat, lng, zoom };
};

/**
 * Formats a camera as stable query strings.
 *
 * @param camera - Map center and zoom
 * @returns Serialized lat, lng, and zoom
 */
export const serializeMapCameraQuery = (camera: MapCamera): MapCameraQuery => {
  return {
    lat: camera.lat.toFixed(LAT_DECIMALS),
    lng: camera.lng.toFixed(LNG_DECIMALS),
    zoom: camera.zoom.toFixed(ZOOM_DECIMALS),
  };
};

/**
 * Returns the camera to use when the map is created.
 *
 * If the URL has a feature id, use the view default camera. The feature
 * handler then flies to that feature. Camera query params restore the view
 * only when no feature id is present.
 *
 * @param query - Current route query
 * @param defaults - View default camera from config
 * @returns Camera for map init
 */
export const getInitialMapCamera = (
  query: Record<string, unknown>,
  defaults: MapCamera,
): MapCamera => {
  if (hasMapFeatureIdQuery(query)) {
    return defaults;
  }
  return parseMapCameraQuery(query) ?? defaults;
};

/**
 * Reads the current map center and zoom.
 *
 * @param map - Mapbox map instance
 * @returns Current camera
 */
export const readMapCamera = (map: MapboxMap): MapCamera => {
  const center = map.getCenter();
  return {
    lat: center.lat,
    lng: center.lng,
    zoom: map.getZoom(),
  };
};

/**
 * Returns true when the query already matches the serialized camera.
 *
 * @param query - Current route query
 * @param camera - Current map camera
 * @returns True when a replace would not change lat, lng, or zoom
 */
export const hasSameMapCameraQuery = (
  query: Record<string, unknown>,
  camera: MapCamera,
): boolean => {
  const serialized = serializeMapCameraQuery(camera);
  return (
    query.lat === serialized.lat &&
    query.lng === serialized.lng &&
    query.zoom === serialized.zoom
  );
};

/**
 * Builds a shareable viewport URL. Feature ids are removed. Camera params
 * are set from the supplied camera, not from the live address bar.
 *
 * @param href - Current page URL
 * @param camera - Camera to share
 * @returns URL with lat, lng, and zoom and without feature ids
 */
export const buildMapLocationShareUrl = (
  href: string,
  camera: MapCamera,
): string => {
  const url = new URL(href);
  MAP_FEATURE_ID_QUERY_KEYS.forEach((key) => {
    url.searchParams.delete(key);
  });
  const serialized = serializeMapCameraQuery(camera);
  url.searchParams.set("lat", serialized.lat);
  url.searchParams.set("lng", serialized.lng);
  url.searchParams.set("zoom", serialized.zoom);
  return url.toString();
};

/**
 * Writes lat, lng, and zoom to the URL after the map finishes moving.
 * Uses replace so map interaction does not fill history.
 *
 * @param map - Mapbox map instance
 * @param route - Current route
 * @param router - Vue router
 */
export const attachMapCameraQuerySync = (
  map: MapboxMap,
  route: RouteLocationNormalizedLoaded,
  router: Router,
): void => {
  map.on("moveend", () => {
    const camera = readMapCamera(map);
    if (hasSameMapCameraQuery(route.query, camera)) {
      return;
    }
    router.replace({
      query: {
        ...route.query,
        ...serializeMapCameraQuery(camera),
      },
    });
  });
};
