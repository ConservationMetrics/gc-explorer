import { fetchConfig, fetchData } from "@/server/database/dbOperations";
import {
  filterGeoData,
  filterToSelectedValues,
  filterByDateRange,
} from "@/server/dataProcessing/dataFilters";
import { hasValidCoordinates } from "@/utils/geoUtils";
import { validatePermissions } from "@/utils/accessControls";
import { escapeCSVValue } from "@/utils/csvUtils";
import { requireTableViewConfig } from "@/server/utils";
// @ts-expect-error - tokml does not have types
import tokml from "tokml";

import type { H3Event } from "h3";
import type { DataEntry, ColumnEntry } from "@/types";
import type {
  Feature,
  FeatureCollection,
  GeoJsonProperties,
  Geometry,
  Position,
} from "geojson";

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
 * Rows without valid geometry are skipped unless `allowNullGeometry` is true
 * (single-record export), in which case one Feature per row uses `geometry: null`
 * and still carries all non-`g__` properties.
 *
 * @param {DataEntry[]} data - Raw database rows.
 * @param {boolean} [allowNullGeometry] - When true, emit features with null geometry if coords are missing or invalid.
 * @returns {FeatureCollection} A valid GeoJSON FeatureCollection.
 */
const buildGeoJson = (
  data: DataEntry[],
  allowNullGeometry = false,
): FeatureCollection => {
  const features: Array<Feature<Geometry | null, GeoJsonProperties>> = [];

  for (const entry of data) {
    const properties: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(entry)) {
      if (key.startsWith("g__")) continue;
      properties[key] = value;
    }

    const geoType = entry.g__type as string | undefined;
    const rawCoords = entry.g__coordinates as string | undefined;
    let placed = false;

    if (hasValidCoordinates(entry) && geoType && rawCoords) {
      try {
        const coordinates = JSON.parse(rawCoords) as
          | Position
          | Position[]
          | Position[][]
          | Position[][][];
        const geometry: Geometry = {
          type: geoType as Geometry["type"],
          coordinates,
        } as Geometry;
        features.push({
          type: "Feature",
          geometry,
          properties,
        });
        placed = true;
      } catch {
        // fall through to optional null-geometry feature
      }
    }

    if (!placed && allowNullGeometry) {
      const nullGeomFeature: Feature<Geometry | null, GeoJsonProperties> = {
        type: "Feature",
        geometry: null,
        properties,
      };
      features.push(nullGeomFeature);
    }
  }

  return {
    type: "FeatureCollection",
    features: features as Feature[],
  };
};

/**
 * Streaming export endpoint for raw dataset downloads.
 * Accepts a `format` query parameter (csv, geojson, kml) and optional
 * `recordId` (warehouse `_id`) to export a single row with the same raw
 * columns as the full-dataset export. Returns the dataset as a file download
 * with appropriate Content-Type and Content-Disposition headers.
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
    const tableConfig = requireTableViewConfig(viewsConfig, table);
    const permission = tableConfig.ROUTE_LEVEL_PERMISSION ?? "member";
    await validatePermissions(event, permission);

    const { mainData, columnsData } = await fetchData(table);

    const recordIdParam = (query.recordId as string | undefined)?.trim() ?? "";

    let scopedData: DataEntry[] = mainData;
    if (recordIdParam) {
      scopedData = mainData.filter((row) => String(row._id) === recordIdParam);
      if (scopedData.length === 0) {
        throw createError({
          statusCode: 404,
          statusMessage: "Record not found",
        });
      }
    }

    const singleRecordExport = Boolean(recordIdParam);

    // Users expect all of their data when they download; therefore, we do not apply config-based filter-out (FILTER_BY_COLUMN / FILTER_OUT_VALUES). Bulk export keeps only rows with valid geo. Single-record export keeps the full warehouse row so CSV / GeoJSON / KML all carry the same raw attributes (GeoJSON may use null geometry; see KML branch).
    let dataToExport = singleRecordExport
      ? scopedData
      : filterGeoData(scopedData);

    const filterColumn = (query.filterColumn as string)?.trim();
    const filterValues = (query.filterValues as string)?.trim();
    if (filterColumn && filterValues) {
      dataToExport = filterToSelectedValues(
        dataToExport,
        filterColumn,
        filterValues,
      );
    }

    const timestampColumn = tableConfig.TIMESTAMP_COLUMN;
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
      const geojson = buildGeoJson(dataToExport, singleRecordExport);
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
