import { hasValidCoordinates } from "@/utils/geoUtils";
import { parseDateMs } from "@/utils/dateUtils";

import type { ColumnEntry, DataEntry, AllowedFileExtensions } from "@/types";

/**
 * Filters out unwanted columns from the provided data entries.
 *
 * This function utilizes SQL column mapping if available to determine which columns
 * should be excluded from the dataset. Column names can be specified as a
 * comma-separated string.
 *
 * @param {DataEntry[]} data - The dataset to be filtered, represented as an array of data entries.
 * @param {ColumnEntry[] | null} columns - An optional array of column entries that provide
 *                                         a mapping between original column names and their
 *                                         corresponding SQL column names. If null, filtering
 *                                         is based on the keys of the data entries.
 * @param {string | undefined} unwantedColumnsList - A comma-separated string of column names
 *                                                   that should be removed from the dataset.
 * @returns {DataEntry[]} - A new array of data entries with the unwanted columns filtered out.
 */
export const filterUnwantedKeys = (
  data: DataEntry[],
  columns: ColumnEntry[] | null,
  unwantedColumnsList: string | undefined,
): DataEntry[] => {
  const filterColumns = (
    originalColumns: Set<string>,
    unwantedColumns: string[],
  ): Set<string> => {
    return new Set(
      [...originalColumns].filter((column) => unwantedColumns.includes(column)),
    );
  };

  const unwantedColumns = unwantedColumnsList
    ? unwantedColumnsList.split(",")
    : [];

  let filteredSqlColumns: Set<string>;

  if (columns) {
    const columnMapping: { [key: string]: string } = {};
    columns.forEach((column) => {
      columnMapping[column.original_column] = column.sql_column;
    });

    const originalColumnsSet = new Set(
      columns.map((column) => column.original_column),
    );
    const unwantedColumnsSet = filterColumns(
      originalColumnsSet,
      unwantedColumns,
    );

    const unwantedSqlColumns = new Set(
      [...unwantedColumnsSet].map((column) => columnMapping[column]),
    );

    filteredSqlColumns = new Set(
      Object.values(columnMapping).filter(
        (sqlColumn) => !unwantedSqlColumns.has(sqlColumn),
      ),
    );
  } else {
    filteredSqlColumns = new Set(
      Object.keys(data[0]).filter((key) => !unwantedColumns.includes(key)),
    );
  }

  const filteredData = data.map((item) =>
    Object.keys(item)
      .filter((key) => filteredSqlColumns.has(key))
      .reduce((obj: DataEntry, key) => {
        obj[key] = item[key];
        return obj;
      }, {}),
  );

  return filteredData;
};

/** Filters out data that matches a comma-separated list of values for a given column. */
export const filterOutUnwantedValues = (
  data: DataEntry[],
  filterByColumn: string | undefined,
  filterOutValues: string | undefined,
): DataEntry[] => {
  if (!filterByColumn || !filterOutValues) {
    return data;
  }

  const valuesToFilterOut = new Set(filterOutValues.split(","));

  const filteredData = data.filter((item) => {
    return !valuesToFilterOut.has(item[filterByColumn]);
  });

  return filteredData;
};

/**
 * Keeps only rows where the given column value is in the allowed set.
 * The string "null" in allowedValues is treated as matching null/undefined/empty.
 *
 * @param {DataEntry[]} data - Rows to filter.
 * @param {string | undefined} filterByColumn - Column name to filter on.
 * @param {string | undefined} filterValuesList - Comma-separated allowed values; "null" matches missing/empty.
 * @returns {DataEntry[]} Filtered rows.
 */
export const filterToSelectedValues = (
  data: DataEntry[],
  filterByColumn: string | undefined,
  filterValuesList: string | undefined,
): DataEntry[] => {
  if (!filterByColumn || !filterValuesList) {
    return data;
  }
  const parts = filterValuesList.split(",").map((p) => p.trim());
  const allowNull = parts.includes("null");
  const valueSet = new Set(parts.filter((p) => p !== "null"));

  return data.filter((item) => {
    const raw = item[filterByColumn];
    const value = raw == null || raw === "" ? null : String(raw);
    if (value === null) {
      return allowNull;
    }
    return valueSet.has(value);
  });
};

/**
 * Keeps only rows where the timestamp column value falls within [minDate, maxDate] (inclusive).
 *
 * @param {DataEntry[]} data - Rows to filter.
 * @param {string | undefined} timestampColumn - Column name holding the date value.
 * @param {string | undefined} minDate - Minimum date (inclusive).
 * @param {string | undefined} maxDate - Maximum date (inclusive).
 * @returns {DataEntry[]} Filtered rows.
 */
export const filterByDateRange = (
  data: DataEntry[],
  timestampColumn: string | undefined,
  minDate: string | undefined,
  maxDate: string | undefined,
): DataEntry[] => {
  if (!timestampColumn || (!minDate && !maxDate)) {
    return data;
  }
  const minMs = minDate ? parseDateMs(minDate) : null;
  const maxMs = maxDate ? parseDateMs(maxDate) : null;
  if (minDate && minMs == null) return data;
  if (maxDate && maxMs == null) return data;

  return data.filter((item) => {
    const valueMs = parseDateMs(item[timestampColumn]);
    if (valueMs == null) return false;
    if (minMs != null && valueMs < minMs) return false;
    if (maxMs != null && valueMs > maxMs) return false;
    return true;
  });
};

/** Filters out data without columns storing valid coordinates. */
export const filterGeoData = (
  data: DataEntry[] | null | undefined,
): DataEntry[] => {
  if (!Array.isArray(data)) {
    console.warn("Data is null, undefined, or not an array");
    return [];
  }
  const geoData = data.filter((feature: DataEntry) =>
    hasValidCoordinates(feature),
  );

  return geoData;
};

/** True if a string value mentions any configured audio/image/video extension. */
export const valueHasAllowedFileExtension = (
  value: string,
  extensions: AllowedFileExtensions,
): boolean => {
  const lower = value.toLowerCase();
  const hasExt = (list: string[] = []) =>
    list.some((ext) => lower.includes(ext.toLowerCase().replace(/^\./, "")));

  return (
    hasExt(extensions.audio) ||
    hasExt(extensions.image) ||
    hasExt(extensions.video)
  );
};

/** Filters out data without any columns storing file extensions. */
export const filterDataByExtension = (
  data: DataEntry[],
  extensions: AllowedFileExtensions,
  mediaColumn?: string,
): DataEntry[] => {
  return data.filter((entry) => {
    const valuesToCheck = mediaColumn
      ? [entry[mediaColumn]]
      : Object.values(entry);

    return valuesToCheck.some(
      (value) =>
        typeof value === "string" &&
        valueHasAllowedFileExtension(value, extensions),
    );
  });
};
