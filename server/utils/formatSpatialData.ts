import murmurhash from "murmurhash";

import {
  hasValidCoordinates,
  getRandomColor,
} from "@/server/dataProcessing/helpers";

import type { Feature, FeatureCollection, Geometry, Position } from "geojson";
import type { DataEntry } from "@/types/types";

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
    if (!hasValidCoordinates(entry)) continue;

    const geoType = entry.g__type as string | undefined;
    const rawCoords = entry.g__coordinates as string | undefined;
    if (!geoType || !rawCoords) continue;

    let coordinates: Position | Position[] | Position[][] | Position[][][];
    try {
      coordinates = JSON.parse(rawCoords);
    } catch {
      continue;
    }

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
      // Preserve null for entries without a filter value so DataFilter
      // can distinguish them and display "No column entry"
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
