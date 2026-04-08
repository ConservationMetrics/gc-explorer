import type { Geometry, Feature, FeatureCollection } from "geojson";
import type { DataEntry, MapStatistics } from "@/types";

import murmurhash from "murmurhash";

import { getRandomColor } from "@/utils";

export interface SpatialDataOptions {
  idField?: string;
  includeProperties?: string[];
  includeAllProperties?: boolean;
  filterColumn?: string;
  generateId?: (entry: DataEntry) => number | string | undefined;
  /**
   * When true, enables Mapeo-specific ID normalization. Mapeo document IDs are
   * 64-bit hex strings (e.g. "0084cdc57c0b0280") that exceed JavaScript's safe
   * integer range (2^53 - 1). Mapbox requires feature IDs to be either Numbers
   * or strings safely castable to Numbers; without normalization, Mapbox falls
   * back to undefined IDs and setFeatureState() fails.
   *
   * This option resolves the ID from both `_id` and `id` fields (Mapeo data may
   * use either), validates the 16-char hex format, and hashes via MurmurHash to
   * produce a safe 32-bit integer.
   *
   * Reference: https://stackoverflow.com/questions/72040370/why-are-my-dataset-features-ids-undefined-in-mapbox-gl-while-i-have-set-them
   */
  isMapeoData?: boolean;
}

/** Checks if a number is a valid geographic coordinate. */
export const isValidCoordinate = (coord: number): boolean => {
  return coord != null && !isNaN(coord) && coord >= -180 && coord <= 180;
};

/** Determines if an object contains valid coordinate data. */
export const hasValidCoordinates = (
  obj: Record<string, string | number | null>,
): boolean => {
  return Object.keys(obj).some((key) => {
    if (key.toLowerCase().includes("coordinates")) {
      const rawCoordinates = obj[key];

      if (!rawCoordinates) {
        console.warn("Null or undefined coordinates:", key);
        return false; // skip if coordinates are null or undefined
      }

      let parsedCoordinates: number[] = [];

      // Filter out data with null or empty coordinates
      if (typeof rawCoordinates === "string") {
        const trimmed = rawCoordinates.replace(/\s+/g, "");

        // Check if it's a JSON-like array or a simple CSV
        if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
          try {
            parsedCoordinates = JSON.parse(trimmed);
          } catch (e) {
            console.warn("Error parsing JSON coordinates:", rawCoordinates, e);
            return false;
          }
        } else {
          // Try splitting as CSV string
          const splitCoordinates = trimmed.split(",");
          // Ensure each part can be converted to a valid number
          if (splitCoordinates.every((coord) => !isNaN(Number(coord)))) {
            parsedCoordinates = splitCoordinates.map(Number);
          } else {
            console.warn("Invalid CSV coordinates:", rawCoordinates);
            return false;
          }
        }
      } else if (Array.isArray(rawCoordinates)) {
        parsedCoordinates = rawCoordinates.flat().map(Number);
      }

      // Flatten nested coordinate arrays (Polygon, LineString, MultiPolygon)
      // before validating individual numbers.
      if (Array.isArray(parsedCoordinates) && parsedCoordinates.length > 0) {
        const flatCoords = (parsedCoordinates as unknown[]).flat(
          Infinity,
        ) as number[];
        return (
          flatCoords.length > 0 &&
          flatCoords.length % 2 === 0 &&
          flatCoords.every(isValidCoordinate)
        );
      }

      console.warn("Coordinates array is empty or invalid:", parsedCoordinates);
      return false;
    }
    return false;
  });
};

type Coordinate = [number, number];
type LineString = Coordinate[];
type Polygon = LineString[];
type MultiPolygon = Polygon[];

/**
 * Returns whether parsed GeoJSON coordinates match the given geometry type.
 *
 * @param {string} type - GeoJSON geometry type name.
 * @param {unknown} coordinates - Parsed coordinates (not a JSON string).
 * @returns {boolean} True when the structure is valid for `type`.
 */
const coordinatesMatchGeoType = (
  type: string,
  coordinates: unknown,
): boolean => {
  if (type === "Point") {
    return (
      Array.isArray(coordinates) &&
      coordinates.length === 2 &&
      coordinates.every(Number.isFinite)
    );
  }
  if (type === "LineString" || type === "MultiLineString") {
    return (
      Array.isArray(coordinates) &&
      coordinates.every(
        (coord) =>
          Array.isArray(coord) &&
          coord.length === 2 &&
          coord.every(Number.isFinite),
      )
    );
  }
  if (type === "Polygon") {
    return (
      Array.isArray(coordinates) &&
      coordinates.every(
        (ring) =>
          Array.isArray(ring) &&
          ring.every(
            (coord) =>
              Array.isArray(coord) &&
              coord.length === 2 &&
              coord.every(Number.isFinite),
          ),
      )
    );
  }
  if (type === "MultiPolygon") {
    return (
      Array.isArray(coordinates) &&
      coordinates.every(
        (polygon) =>
          Array.isArray(polygon) &&
          polygon.every(
            (ring) =>
              Array.isArray(ring) &&
              ring.every(
                (coord) =>
                  Array.isArray(coord) &&
                  coord.length === 2 &&
                  coord.every(Number.isFinite),
              ),
          ),
      )
    );
  }
  return false;
};

/**
 * Geometry type names allowed on warehouse rows (`g__type`) for this app’s map
 * and alerts pipelines. This is not an exhaustive GeoJSON enum (e.g. no
 * GeometryCollection); it matches what we persist and serve through
 * `buildMinimalFeatureCollection` and related paths.
 */
const DATA_ENTRY_SUPPORTED_GEOMETRY_TYPES = [
  "LineString",
  "MultiLineString",
  "Point",
  "Polygon",
  "MultiPolygon",
] as const;

/**
 * Parses `g__coordinates` once and returns the coordinate tree when it matches
 * `g__type` and structural validation; otherwise returns null. Used to avoid
 * duplicate `JSON.parse` across validation, centroid, and GeoJSON feature
 * construction for {@link DataEntry} rows. Not a general-purpose GeoJSON
 * validator; see {@link hasValidCoordinates} for coordinate fields keyed by name
 * (e.g. CSV-style rows).
 *
 * @param {DataEntry} item - Row with `g__type` and `g__coordinates`.
 * @returns {unknown | null} Parsed coordinates, or null if invalid.
 */
export const tryParseDataEntryGeoCoordinates = (
  item: DataEntry,
): unknown | null => {
  const type = item.g__type as string | undefined;
  const raw = item.g__coordinates;

  if (
    !type ||
    !DATA_ENTRY_SUPPORTED_GEOMETRY_TYPES.includes(
      type as (typeof DATA_ENTRY_SUPPORTED_GEOMETRY_TYPES)[number],
    ) ||
    raw == null ||
    raw === ""
  ) {
    return null;
  }

  let parsed: unknown;
  if (typeof raw === "string") {
    try {
      parsed = JSON.parse(raw);
    } catch {
      return null;
    }
  } else {
    parsed = raw;
  }

  if (!coordinatesMatchGeoType(type, parsed)) {
    return null;
  }

  return parsed;
};

/**
 * Computes centroid string from already-parsed GeoJSON coordinates (same shape
 * as `JSON.parse` on `g__coordinates`).
 *
 * @param {unknown} allCoords - Parsed coordinates tree.
 * @returns {string} `"lat, lng"` average or empty string when invalid.
 */
export const calculateCentroidFromParsedCoords = (
  allCoords: unknown,
): string => {
  let totalLat = 0;
  let totalLng = 0;
  let numCoords = 0;

  const processCoord = (coord: Coordinate) => {
    totalLng += coord[0];
    totalLat += coord[1];
    numCoords++;
  };

  const processLineString = (lineString: LineString) => {
    lineString.forEach(processCoord);
  };

  const processPolygon = (polygon: Polygon) => {
    polygon.forEach(processLineString);
  };

  if (
    Array.isArray(allCoords) &&
    Array.isArray(allCoords[0]) &&
    Array.isArray((allCoords as unknown[])[0][0]) &&
    Array.isArray((allCoords as unknown[])[0][0][0])
  ) {
    // It's a MultiPolygon
    (allCoords as MultiPolygon).forEach(processPolygon);
  } else if (
    Array.isArray(allCoords) &&
    Array.isArray(allCoords[0]) &&
    Array.isArray((allCoords as unknown[])[0][0])
  ) {
    // It's a Polygon
    processPolygon(allCoords as Polygon);
  } else if (Array.isArray(allCoords) && Array.isArray(allCoords[0])) {
    // It's a LineString
    processLineString(allCoords as LineString);
  } else if (
    Array.isArray(allCoords) &&
    typeof allCoords[0] === "number" &&
    typeof allCoords[1] === "number"
  ) {
    // It's a Point
    processCoord(allCoords as Coordinate);
  } else {
    console.error("Invalid input format");
    return "";
  }

  const avgLng = (totalLng / numCoords).toFixed(6);
  const avgLat = (totalLat / numCoords).toFixed(6);

  return `${avgLat}, ${avgLng}`;
};

/**
 * Calculates the centroid of coordinate JSON stored as a string.
 *
 * @param {string} coords - JSON string of GeoJSON coordinates.
 * @returns {string} `"lat, lng"` average or empty string when invalid.
 */
export const calculateCentroid = (coords: string): string => {
  let allCoords: unknown;
  try {
    allCoords = JSON.parse(coords);
  } catch {
    return "";
  }
  return calculateCentroidFromParsedCoords(allCoords);
};

/** Validates if a data entry has valid geolocation data. */
export const isValidGeolocation = (item: DataEntry): boolean => {
  return tryParseDataEntryGeoCoordinates(item) !== null;
};

/**
 * Builds a GeoJSON FeatureCollection from raw database rows. Each feature carries
 * geometry, a stable numeric ID (MurmurHash, for Mapbox feature-state), and either
 * an explicit set of property fields or all non-geometry fields. When a filterColumn
 * is specified, a deterministic "filter-color" is assigned per unique value.
 *
 * @param {DataEntry[]} data - Raw database rows, each expected to have g__type and g__coordinates.
 * @param {SpatialDataOptions} options - Controls which properties to include, ID generation, and filter coloring.
 * @returns {FeatureCollection} A valid GeoJSON FeatureCollection ready for Mapbox consumption.
 */
export const buildMinimalFeatureCollection = (
  data: DataEntry[],
  options: SpatialDataOptions = {},
): FeatureCollection => {
  const {
    idField = "_id",
    includeProperties = [],
    includeAllProperties = false,
    filterColumn,
    generateId,
    isMapeoData = false,
  } = options;

  const colorMap = new Map<string, string>();

  const features: Feature[] = [];

  for (const entry of data) {
    const coordinates = tryParseDataEntryGeoCoordinates(entry);
    if (coordinates === null) continue;

    const geoType = entry.g__type as string | undefined;
    if (!geoType) continue;

    const geometry = {
      type: geoType,
      coordinates,
    } as Geometry;

    const rawId = entry[idField] as string | undefined;
    let featureId: number | string | undefined;

    if (generateId) {
      featureId = generateId(entry);
    } else if (isMapeoData) {
      // Mapeo IDs can be in _id or id; validate 16-char hex before hashing
      const mapeoId = (entry._id || entry.id) as string | undefined;
      if (
        mapeoId &&
        typeof mapeoId === "string" &&
        mapeoId.match(/^[0-9a-fA-F]{16}$/)
      ) {
        featureId = murmurhash.v3(mapeoId);
      }
    } else if (rawId) {
      featureId = murmurhash.v3(rawId);
    }

    const properties: Record<string, unknown> = {};
    if (rawId) {
      properties[idField] = rawId;
    }

    if (includeAllProperties) {
      for (const [key, value] of Object.entries(entry)) {
        if (key.startsWith("g__")) continue;
        properties[key] = value;
      }
    } else {
      for (const prop of includeProperties) {
        if (prop in entry && entry[prop] != null && entry[prop] !== "") {
          properties[prop] = entry[prop];
        }
      }
    }

    if (filterColumn) {
      const rawFilterValue = entry[filterColumn];
      const filterValue = (rawFilterValue ?? "") as string;
      if (filterValue && !colorMap.has(filterValue)) {
        colorMap.set(filterValue, getRandomColor());
      }
      properties["filter-color"] = colorMap.get(filterValue) ?? "#3333FF";
      // Preserve null for entries without a filter value so it can be
      // distinguished and displayed as "No column entry"
      properties[filterColumn] = rawFilterValue != null ? rawFilterValue : null;
    } else {
      // Always assign a default filter-color so Mapbox paint expressions
      // that reference it (e.g. ["get", "filter-color"]) don't resolve
      // to null and fall back to black
      properties["filter-color"] = "#3333FF";
    }

    features.push({
      type: "Feature",
      id: featureId,
      geometry,
      properties,
    });
  }

  return {
    type: "FeatureCollection",
    features,
  };
};

/**
 * Derives map statistics from a GeoJSON FeatureCollection.
 * totalFeatures is the number of features; dateRange is derived from
 * feature properties using date-like column names (date, time, created, modified, updated).
 *
 * @param {FeatureCollection} collection - GeoJSON FeatureCollection.
 * @returns {MapStatistics} totalFeatures and optional dateRange.
 */
export const mapStatisticsFromFeatureCollection = (
  collection: FeatureCollection,
): MapStatistics => {
  const features = collection?.features ?? [];
  if (features.length === 0) {
    return { totalFeatures: 0 };
  }

  let dateRange: string | undefined;
  const firstProps = features[0]?.properties;
  const dateColumns = firstProps
    ? Object.keys(firstProps).filter((key) => {
        const lowerKey = key.toLowerCase();
        return (
          lowerKey.includes("date") ||
          lowerKey.includes("time") ||
          lowerKey.includes("created") ||
          lowerKey.includes("modified") ||
          lowerKey.includes("updated")
        );
      })
    : [];

  if (dateColumns.length > 0) {
    const dates = features
      .map((feature) => {
        const props = feature.properties;
        if (!props) return null;
        for (const col of dateColumns) {
          const raw = props[col];
          if (raw != null && raw !== "") {
            const value = String(raw);
            if (
              /\d/.test(value) &&
              (/[-/]/.test(value) || /^\d{4}$/.test(value))
            ) {
              return value;
            }
          }
        }
        return null;
      })
      .filter((v): v is string => v != null)
      .sort();

    if (dates.length > 0) {
      dateRange = `${dates[0]} to ${dates[dates.length - 1]}`;
    }
  }

  return {
    totalFeatures: features.length,
    dateRange,
  };
};
