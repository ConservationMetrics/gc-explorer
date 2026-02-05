import type { Feature, FeatureCollection, Geometry } from "geojson";
import type { ViewConfig } from "@/types/types";

const VALID_GEO_TYPES = [
  "LineString",
  "MultiLineString",
  "Point",
  "Polygon",
  "MultiPolygon",
];

function isValidCoordinates(
  type: string,
  coordinates: Geometry | string | null | undefined,
): boolean {
  if (coordinates == null) return false;
  let coords: unknown = coordinates;
  if (typeof coordinates === "string") {
    try {
      coords = JSON.parse(coordinates);
    } catch {
      return false;
    }
  }
  const c = coords as number[] | number[][][] | number[][][][];
  if (type === "Point") {
    return (
      Array.isArray(c) &&
      c.length === 2 &&
      typeof c[0] === "number" &&
      typeof c[1] === "number" &&
      Number.isFinite(c[0]) &&
      Number.isFinite(c[1])
    );
  }
  if (type === "LineString" || type === "MultiLineString") {
    return (
      Array.isArray(c) &&
      c.every(
        (coord) =>
          Array.isArray(coord) &&
          coord.length >= 2 &&
          typeof coord[0] === "number" &&
          typeof coord[1] === "number" &&
          Number.isFinite(coord[0]) &&
          Number.isFinite(coord[1]),
      )
    );
  }
  if (type === "Polygon" || type === "MultiPolygon") {
    return (
      Array.isArray(c) &&
      c.every(
        (ring) =>
          Array.isArray(ring) &&
          (Array.isArray(ring[0])
            ? ring.every(
                (coord) =>
                  Array.isArray(coord) &&
                  coord.length >= 2 &&
                  typeof coord[0] === "number" &&
                  typeof coord[1] === "number",
              )
            : ring.length >= 2 &&
              typeof ring[0] === "number" &&
              typeof ring[1] === "number"),
      )
    );
  }
  return false;
}

/** Returns true if the row has valid _id, g__type and g__coordinates for map display. */
export function isValidGeoRow(
  row: Record<string, unknown>,
): row is Record<string, unknown> & {
  _id: string;
  g__type: string;
  g__coordinates: string;
} {
  const id = row._id;
  const type = row.g__type;
  const coords = row.g__coordinates;
  if (id == null || String(id).trim() === "") return false;
  if (typeof type !== "string" || type === "" || coords == null) return false;
  if (!VALID_GEO_TYPES.includes(type)) return false;
  return isValidCoordinates(type, coords as string);
}

/** Deterministic color from a string (for filter-color). Uses a fixed palette. */
const FILTER_COLOR_PALETTE = [
  "#3333FF",
  "#E6194B",
  "#3CB44B",
  "#FFE119",
  "#4363D8",
  "#F58231",
  "#42D4F4",
  "#F032E6",
  "#BFEF45",
  "#469990",
  "#DCBEFF",
  "#9A6324",
  "#FFFAC8",
  "#800000",
  "#AFF8A8",
];

function stringHash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h << 5) - h + s.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

export function getFilterColorForValue(value: string): string {
  if (!value) return FILTER_COLOR_PALETTE[0];
  const index = stringHash(value) % FILTER_COLOR_PALETTE.length;
  return FILTER_COLOR_PALETTE[index];
}

/** Filter out rows whose filter-by column value is in the filter-out list. */
export function filterOutUnwantedValues(
  rows: Record<string, unknown>[],
  filterByColumn: string | undefined,
  filterOutValues: string | undefined,
): Record<string, unknown>[] {
  if (!filterByColumn || !filterOutValues) return rows;
  const toRemove = new Set(
    filterOutValues.split(",").map((v) => v.trim()).filter(Boolean),
  );
  return rows.filter((row) => {
    const val = row[filterByColumn];
    return !toRemove.has(String(val ?? ""));
  });
}

/**
 * Build a minimal GeoJSON FeatureCollection from minimal map rows.
 * Uses flat properties (_id, filter-color, COLOR_COLUMN, ICON_COLUMN, FRONT_END_FILTER_COLUMN)
 * so MapView can read properties._id and style by color/icon/filter without change.
 */
export function buildMapFeatureCollection(
  rows: (Record<string, unknown> & { _id: string; g__type: string; g__coordinates: string })[],
  config: ViewConfig,
): FeatureCollection {
  const colorColumn = config.COLOR_COLUMN;
  const iconColumn = config.ICON_COLUMN;
  const filterColumn = config.FRONT_END_FILTER_COLUMN;

  const features: Feature[] = rows.map((row) => {
    let coordinates: number[] | number[][] | number[][][];
    try {
      const raw = row.g__coordinates;
      coordinates =
        typeof raw === "string" ? JSON.parse(raw) : (raw as number[]);
    } catch {
      coordinates = [];
    }

    const geometry: Geometry = {
      type: row.g__type as "Point" | "LineString" | "Polygon",
      coordinates,
    };

    const filterValue =
      filterColumn != null ? String(row[filterColumn] ?? "") : "";
    const filterColor = getFilterColorForValue(filterValue);

    const properties: Record<string, string> = {
      _id: String(row._id),
      "filter-color": filterColor,
    };
    if (colorColumn && row[colorColumn] != null) {
      properties[colorColumn] = String(row[colorColumn]);
    }
    if (iconColumn && row[iconColumn] != null) {
      properties[iconColumn] = String(row[iconColumn]);
    }
    if (
      filterColumn &&
      filterColumn !== colorColumn &&
      filterColumn !== iconColumn &&
      row[filterColumn] != null
    ) {
      properties[filterColumn] = String(row[filterColumn]);
    }

    return {
      type: "Feature",
      id: String(row._id),
      geometry,
      properties,
    };
  });

  return { type: "FeatureCollection", features };
}
