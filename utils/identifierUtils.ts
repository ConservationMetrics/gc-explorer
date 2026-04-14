import type { AlertsData } from "@/types";
import { isGeoJsonFeature } from "@/utils/geoUtils";

/**
 * Strips combining diacritical marks after NFD normalization (ASCII-friendly identifiers).
 *
 * @param value - Raw string.
 * @returns The string without combining marks.
 */
const stripCombiningMarks = (value: string): string => {
  return value.normalize("NFD").replace(/\p{M}/gu, "");
};

/**
 * Produces a short filesystem-safe segment from a user-facing label (e.g. incident name in download filenames).
 * Strips combining marks, keeps alphanumerics plus hyphen and underscore, replaces other characters with underscores, then truncates.
 *
 * @param value - Raw label.
 * @param maxLength - Maximum length after sanitization.
 * @param fallback - Used when the sanitized result is empty.
 * @returns Safe segment for use in filenames.
 */
export const sanitizeFilenameSegment = (
  value: string,
  maxLength = 80,
  fallback = "incident",
): string => {
  const asciiish = stripCombiningMarks(value);
  const cleaned = asciiish.replace(/[^a-z0-9-_]+/gi, "_").slice(0, maxLength);
  return cleaned || fallback;
};

/**
 * Converts CamelCase to snake_case, aligned with gc-scripts-hub
 * `f/common_logic/identifier_utils.py` `camel_to_snake`.
 *
 * @see https://stackoverflow.com/questions/1175208/elegant-python-function-to-convert-camelcase-to-snake-case
 */
const CAMEL_TO_SNAKE_PATTERN = /(?<=[a-z])(?=[A-Z])|(?<=[A-Z])(?=[A-Z][a-z])/g;

export const camelToSnake = (name: string): string => {
  return name.replace(CAMEL_TO_SNAKE_PATTERN, "_").toLowerCase();
};

/** Converts a string to camelCase format. */
export const toCamelCase = (key: string): string => {
  return key
    .toLowerCase()
    .replace(/_([a-z0-9])/g, (_, p1: string) => p1.toUpperCase())
    .replace(/(^\w)/, (match) => match.toLowerCase());
};

/** Replaces underscores with spaces (e.g. table slug for display). */
export const replaceUnderscoreWithSpace = (str: string): string => {
  return str.replace(/_/g, " ");
};

/**
 * Converts Title Case (or spaced words) to snake_case
 * @param str - The string to convert (e.g., "Illegal Logging")
 * @returns The snake_case version (e.g., "illegal_logging")
 */
export const titleToSnakeCase = (str: string): string => {
  return str.trim().toLowerCase().replace(/\s+/g, "_");
};

/**
 * Converts snake_case to Title Case
 * @param str - The string to convert (e.g., "illegal_logging")
 * @returns The Title Case version (e.g., "Illegal Logging")
 */
export const snakeToTitleCase = (str: string): string => {
  return str
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
};

/**
 * Converts Title Case (or spaced words) to camelCase
 * @param str - The string to convert (e.g., "Illegal Logging")
 * @returns The camelCase version (e.g., "illegalLogging")
 */
export const titleToCamelCase = (str: string): string => {
  return str
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .map((word, index) =>
      index === 0 ? word : word.charAt(0).toUpperCase() + word.slice(1),
    )
    .join("");
};

/**
 * Resolves the warehouse `_id` for raw dataset export from a selected map row.
 * Map GeoJSON features carry `_id` on `properties`; the sidebar row may expose `_id` or transformed `id`.
 *
 * @param featureGeojson - Optional map selection (only GeoJSON Features are read).
 * @param displayFeature - Display row shown next to the map.
 * @returns {string | undefined} Warehouse id, or undefined if it cannot be resolved.
 */
export const warehouseRecordIdForExport = (
  featureGeojson?: AlertsData | null | unknown,
  displayFeature: Record<string, unknown> = {},
): string | undefined => {
  if (isGeoJsonFeature(featureGeojson)) {
    const featureRecordId = String(featureGeojson.properties?._id ?? "").trim();
    if (featureRecordId) {
      return featureRecordId;
    }
  }

  const displayRecordId = String(
    displayFeature._id ?? displayFeature.id ?? "",
  ).trim();
  return displayRecordId || undefined;
};
