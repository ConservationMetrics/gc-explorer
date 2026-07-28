import type {
  Geometry,
  Feature,
  FeatureCollection,
  GeoJsonProperties,
  Position,
} from "geojson";
import type {
  DataEntry,
  DataEntryGeometryCoordinates,
  DataEntryGeometryType,
  GeoJsonCoordinateCandidate,
  JsonValue,
  MapStatistics,
} from "@/types";
import { DATA_ENTRY_GEOMETRY_TYPES } from "@/types";

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

/**
 * GeoJSON Position: `[lng, lat]` or `[lng, lat, elevation, ...]`.
 * @see https://datatracker.ietf.org/doc/html/rfc7946#section-3.1.1
 */
export const isValidPosition = (
  coord: GeoJsonCoordinateCandidate,
): coord is Position => {
  if (coord.length < 2) return false;
  if (typeof coord[0] !== "number") return false;
  const numbers = coord as number[];
  const [lng, lat, ...rest] = numbers;
  if (typeof lat !== "number") return false;
  if (!isValidCoordinate(lng) || !isValidCoordinate(lat)) return false;
  return rest.every((n) => typeof n === "number" && Number.isFinite(n));
};

const isLineStringCoordinates = (
  coordinates: GeoJsonCoordinateCandidate,
): coordinates is Position[] =>
  coordinates.length > 0 &&
  typeof coordinates[0] !== "number" &&
  coordinates.every(
    (coord): coord is Position =>
      Array.isArray(coord) && isValidPosition(coord),
  );

/** Shared shape for Polygon rings and MultiLineString parts (`Position[][]`). */
const isPolygonOrMultiLineCoordinates = (
  coordinates: GeoJsonCoordinateCandidate,
): coordinates is Position[][] =>
  coordinates.length > 0 &&
  typeof coordinates[0] !== "number" &&
  coordinates.every(
    (ring): ring is Position[] =>
      Array.isArray(ring) && isLineStringCoordinates(ring),
  );

const isMultiPolygonCoordinates = (
  coordinates: GeoJsonCoordinateCandidate,
): coordinates is Position[][][] =>
  coordinates.length > 0 &&
  typeof coordinates[0] !== "number" &&
  coordinates.every(
    (polygon): polygon is Position[][] =>
      Array.isArray(polygon) && isPolygonOrMultiLineCoordinates(polygon),
  );

/**
 * Recursively validates a GeoJSON coordinate tree (Point through MultiPolygon),
 * accepting optional elevation on each Position.
 */
const isValidCoordinateTree = (
  value: GeoJsonCoordinateCandidate,
): value is DataEntryGeometryCoordinates => {
  if (!Array.isArray(value) || value.length === 0) return false;
  if (isValidPosition(value)) return true;
  return value.every(
    (child): child is GeoJsonCoordinateCandidate =>
      Array.isArray(child) && isValidCoordinateTree(child),
  );
};

/** Narrow JSON.parse results to a coordinate candidate array. */
const asCoordinateCandidate = (
  value: JsonValue,
): GeoJsonCoordinateCandidate | null => {
  if (!Array.isArray(value)) return null;
  return value as GeoJsonCoordinateCandidate;
};

/** Determines if an object contains valid coordinate data. */
export const hasValidCoordinates = (
  obj: Record<string, string | number | null | GeoJsonCoordinateCandidate>,
): boolean => {
  return Object.keys(obj).some((key) => {
    if (key.toLowerCase().includes("coordinates")) {
      const rawCoordinates = obj[key];

      if (!rawCoordinates) {
        console.warn("Null or undefined coordinates:", key);
        return false; // skip if coordinates are null or undefined
      }

      let parsedCoordinates: GeoJsonCoordinateCandidate;

      // Filter out data with null or empty coordinates
      if (typeof rawCoordinates === "string") {
        const trimmed = rawCoordinates.replace(/\s+/g, "");

        // Check if it's a JSON-like array or a simple CSV
        if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
          try {
            const parsed = asCoordinateCandidate(
              JSON.parse(trimmed) as JsonValue,
            );
            if (!parsed) {
              console.warn("Error parsing JSON coordinates:", rawCoordinates);
              return false;
            }
            parsedCoordinates = parsed;
          } catch (e) {
            console.warn("Error parsing JSON coordinates:", rawCoordinates, e);
            return false;
          }
        } else {
          // Try splitting as CSV string
          const splitCoordinates = trimmed.split(",");
          // Ensure each part can be converted to a valid number
          if (
            splitCoordinates.length >= 2 &&
            splitCoordinates.every((coord) => !isNaN(Number(coord)))
          ) {
            parsedCoordinates = splitCoordinates.map(Number);
          } else {
            console.warn("Invalid CSV coordinates:", rawCoordinates);
            return false;
          }
        }
      } else if (Array.isArray(rawCoordinates)) {
        parsedCoordinates = rawCoordinates;
      } else {
        return false;
      }

      // Validate nested coordinate arrays (Point, LineString, Polygon, MultiPolygon),
      // including optional elevation on each Position.
      if (isValidCoordinateTree(parsedCoordinates)) {
        return true;
      }

      console.warn("Coordinates array is empty or invalid:", parsedCoordinates);
      return false;
    }
    return false;
  });
};

/** Type guard for a GeoJSON Feature. */
export const isGeoJsonFeature = (
  value: object | null | undefined,
): value is Feature => {
  return (
    !!value &&
    typeof value === "object" &&
    "type" in value &&
    value.type === "Feature"
  );
};

const isDataEntryGeometryType = (type: string): type is DataEntryGeometryType =>
  (DATA_ENTRY_GEOMETRY_TYPES as readonly string[]).includes(type);

/**
 * Returns whether parsed GeoJSON coordinates match the given geometry type.
 * Positions may include elevation per RFC 7946.
 *
 * @param {DataEntryGeometryType} type - GeoJSON geometry type name.
 * @param {GeoJsonCoordinateCandidate} coordinates - Parsed coordinates (not a JSON string).
 * @returns {boolean} True when the structure is valid for `type`.
 */
const coordinatesMatchGeoType = (
  type: DataEntryGeometryType,
  coordinates: GeoJsonCoordinateCandidate,
): coordinates is DataEntryGeometryCoordinates => {
  if (type === "Point") {
    return isValidPosition(coordinates);
  }
  if (type === "LineString") {
    return isLineStringCoordinates(coordinates);
  }
  if (type === "MultiLineString" || type === "Polygon") {
    return isPolygonOrMultiLineCoordinates(coordinates);
  }
  if (type === "MultiPolygon") {
    return isMultiPolygonCoordinates(coordinates);
  }
  return false;
};

/**
 * Parses `g__coordinates` once and returns the coordinate tree when it matches
 * `g__type` and structural validation; otherwise returns null. Used to avoid
 * duplicate `JSON.parse` across validation, centroid, and GeoJSON feature
 * construction for {@link DataEntry} rows. Not a general-purpose GeoJSON
 * validator; see {@link hasValidCoordinates} for coordinate fields keyed by name
 * (e.g. CSV-style rows).
 *
 * @param {DataEntry} item - Row with `g__type` and `g__coordinates`.
 * @returns {DataEntryGeometryCoordinates | null} Parsed coordinates, or null if invalid.
 */
export const tryParseDataEntryGeoCoordinates = (
  item: DataEntry,
): DataEntryGeometryCoordinates | null => {
  const type = item.g__type;
  const raw = item.g__coordinates;

  if (!type || !isDataEntryGeometryType(type) || raw == null || raw === "") {
    return null;
  }

  let parsed: GeoJsonCoordinateCandidate;
  if (typeof raw === "string") {
    try {
      const candidate = asCoordinateCandidate(JSON.parse(raw) as JsonValue);
      if (!candidate) return null;
      parsed = candidate;
    } catch {
      return null;
    }
  } else if (Array.isArray(raw)) {
    parsed = raw as GeoJsonCoordinateCandidate;
  } else {
    return null;
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
 * @param {DataEntryGeometryCoordinates} allCoords - Parsed coordinates tree.
 * @returns {string} `"lat, lng"` average or empty string when invalid.
 */
export const calculateCentroidFromParsedCoords = (
  allCoords: DataEntryGeometryCoordinates,
): string => {
  let totalLat = 0;
  let totalLng = 0;
  let numCoords = 0;

  const processCoord = (coord: Position) => {
    totalLng += coord[0];
    totalLat += coord[1];
    numCoords++;
  };

  const processLineString = (lineString: Position[]) => {
    lineString.forEach(processCoord);
  };

  const processPolygon = (polygon: Position[][]) => {
    polygon.forEach(processLineString);
  };

  if (isMultiPolygonCoordinates(allCoords)) {
    // It's a MultiPolygon
    allCoords.forEach(processPolygon);
  } else if (isPolygonOrMultiLineCoordinates(allCoords)) {
    // It's a Polygon
    processPolygon(allCoords);
  } else if (isLineStringCoordinates(allCoords)) {
    // It's a LineString
    processLineString(allCoords);
  } else if (isValidPosition(allCoords)) {
    // It's a Point
    processCoord(allCoords);
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
  let parsed: JsonValue;
  try {
    parsed = JSON.parse(coords) as JsonValue;
  } catch {
    return "";
  }
  const allCoords = asCoordinateCandidate(parsed);
  if (!allCoords || !isValidCoordinateTree(allCoords)) {
    console.error("Invalid input format");
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

    const geoType = entry.g__type;
    if (!geoType || !isDataEntryGeometryType(geoType)) continue;

    const geometry = {
      type: geoType,
      coordinates,
    } as Geometry;

    const rawId = entry[idField];
    let featureId: number | string | undefined;

    if (generateId) {
      featureId = generateId(entry);
    } else if (isMapeoData) {
      // Mapeo IDs can be in _id or id; validate 16-char hex before hashing
      const mapeoId = entry._id || entry.id;
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

    const properties: GeoJsonProperties = {};
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
      const filterValue = rawFilterValue ?? "";
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
