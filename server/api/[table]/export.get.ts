import { fetchConfig, fetchData } from "@/server/database/dbOperations";
import {
  filterGeoData,
  filterToSelectedValues,
  filterByDateRange,
} from "@/server/dataProcessing/dataFilters";
import { hasValidCoordinates } from "@/utils/geoUtils";
import { validatePermissions } from "@/utils/accessControls";
import { escapeCSVValue } from "@/utils/csvUtils";
// @ts-expect-error - tokml does not have types
import tokml from "tokml";

import type { H3Event } from "h3";
import type { DataEntry, ColumnEntry } from "@/types";
import type { Feature, FeatureCollection, Geometry, Position } from "geojson";

const SUPPORTED_FORMATS = ["csv", "geojson", "kml"] as const;
type ExportFormat = (typeof SUPPORTED_FORMATS)[number];

/**
 * Builds CSV content from raw database rows and column definitions.
 * Uses column names from the __columns table as headers when available,
 * falling back to the keys of the first data row.
 *
 * @param {DataEntry[]} data - Raw database rows.
 * @param {ColumnEntry[] | null} columns - Column metadata from the __columns table.
 * @returns {string} The complete CSV string.
 */
const buildCsv = (data: DataEntry[], columns: ColumnEntry[] | null): string => {
  if (data.length === 0) return "";

  const headers =
    columns && columns.length > 0
      ? columns.map((column) => String(column.sql_column))
      : Object.keys(data[0]);

  const headerRow = headers.map((header) => escapeCSVValue(header)).join(",");

  const dataRows = data.map((row) => {
    return headers.map((header) => escapeCSVValue(row[header])).join(",");
  });

  return [headerRow, ...dataRows].join("\n");
};

/**
 * Builds a GeoJSON FeatureCollection from raw database rows.
 * Only includes records with valid coordinates. All non-geometry
 * fields are included as Feature properties.
 *
 * @param {DataEntry[]} data - Raw database rows.
 * @returns {FeatureCollection} A valid GeoJSON FeatureCollection.
 */
const buildGeoJson = (data: DataEntry[]): FeatureCollection => {
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

    const geometry: Geometry = {
      type: geoType as Geometry["type"],
      coordinates,
    } as Geometry;

    const properties: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(entry)) {
      if (key.startsWith("g__")) continue;
      properties[key] = value;
    }

    features.push({
      type: "Feature",
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
 * Streaming export endpoint for raw dataset downloads.
 * Accepts a `format` query parameter (csv, geojson, kml) and returns
 * the dataset as a file download with appropriate Content-Type and
 * Content-Disposition headers.
 *
 * @param {H3Event} event - The incoming HTTP event.
 * @returns {string} The formatted export content.
 */
export default defineEventHandler(async (event: H3Event) => {
  const { table } = event.context.params as { table: string };
  const query = getQuery(event);
  const format = (query.format as string)?.toLowerCase();

  if (!format || !SUPPORTED_FORMATS.includes(format as ExportFormat)) {
    throw createError({
      statusCode: 400,
      statusMessage: `Invalid or missing format. Supported formats: ${SUPPORTED_FORMATS.join(", ")}`,
    });
  }

  try {
    const viewsConfig = await fetchConfig();
    const permission = viewsConfig[table]?.ROUTE_LEVEL_PERMISSION ?? "member";
    await validatePermissions(event, permission);

    const { mainData, columnsData } = await fetchData(table);

    // Users expect all of their data when they download; therefore, we do not apply config-based filter-out (FILTER_BY_COLUMN / FILTER_OUT_VALUES). We only keep valid geo and, when provided, the user’s current map filter (filterColumn/filterValues) and date range (minDate/maxDate).
    let dataToExport = filterGeoData(mainData);

    const filterColumn = (query.filterColumn as string)?.trim();
    const filterValues = (query.filterValues as string)?.trim();
    if (filterColumn && filterValues) {
      dataToExport = filterToSelectedValues(
        dataToExport,
        filterColumn,
        filterValues,
      );
    }

    const timestampColumn = viewsConfig[table]?.TIMESTAMP_COLUMN;
    const minDate = (query.minDate as string)?.trim();
    const maxDate = (query.maxDate as string)?.trim();
    if (timestampColumn && (minDate || maxDate)) {
      dataToExport = filterByDateRange(
        dataToExport,
        timestampColumn,
        minDate || undefined,
        maxDate || undefined,
      );
    }

    if (format === "csv") {
      const csv = buildCsv(dataToExport, columnsData);
      setResponseHeader(event, "Content-Type", "text/csv; charset=utf-8");
      setResponseHeader(
        event,
        "Content-Disposition",
        `attachment; filename="${table}.csv"`,
      );
      return csv;
    }

    if (format === "geojson") {
      const geojson = buildGeoJson(dataToExport);
      setResponseHeader(
        event,
        "Content-Type",
        "application/geo+json; charset=utf-8",
      );
      setResponseHeader(
        event,
        "Content-Disposition",
        `attachment; filename="${table}.geojson"`,
      );
      return geojson;
    }

    if (format === "kml") {
      const geojson = buildGeoJson(dataToExport);
      const kml = tokml(geojson);
      setResponseHeader(
        event,
        "Content-Type",
        "application/vnd.google-earth.kml+xml; charset=utf-8",
      );
      setResponseHeader(
        event,
        "Content-Disposition",
        `attachment; filename="${table}.kml"`,
      );
      return kml;
    }
  } catch (error) {
    if (error instanceof Error && "statusCode" in error) {
      throw error;
    }
    console.error("Error exporting data:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Internal server error",
    });
  }
});
