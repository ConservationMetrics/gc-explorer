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
}

/**
 * Builds a GeoJSON FeatureCollection from raw database rows. Each feature carries
 * geometry, a stable numeric ID (MurmurHash, for Mapbox feature-state), and either
 * an explicit set of property fields or all non-geometry fields. When a filterColumn
 * is specified, a deterministic "filter-color" is assigned per unique value.
 *
 * @param {DataEntry[]} data - Raw database rows, each expected to have g__type and g__coordinates.
 * @param {SpatialPayloadOptions} options - Controls which properties to include, ID generation, and filter coloring.
 * @returns {FeatureCollection} A valid GeoJSON FeatureCollection ready for Mapbox consumption.
 */
export const buildMinimalFeatureCollection = (
  data: DataEntry[],
  options: SpatialPayloadOptions = {},
): FeatureCollection => {
  const {
    idField = "_id",
    includeProperties = [],
    includeAllProperties = false,
    filterColumn,
    generateId,
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
        if (prop in entry) {
          properties[prop] = entry[prop];
        }
      }
    }

    if (filterColumn) {
      const filterValue = (entry[filterColumn] ?? "") as string;
      if (filterValue && !colorMap.has(filterValue)) {
        colorMap.set(filterValue, getRandomColor());
      }
      properties["filter-color"] = colorMap.get(filterValue) ?? "#3333FF";
      properties[filterColumn] = filterValue;
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
