import { hasValidCoordinates } from "@/utils/geoUtils";

import type { ColumnEntry, DataEntry, AllowedFileExtensions } from "@/types";

/**
 * Filters out unwanted columns and substrings from the provided data entries.
 *
 * This function utilizes SQL column mapping if available to determine which columns
 * should be excluded from the dataset. It processes the data based on a list of unwanted
 * column names and substrings, which can be specified as comma-separated strings.
 *
 * @param {DataEntry[]} data - The dataset to be filtered, represented as an array of data entries.
 * @param {ColumnEntry[] | null} columns - An optional array of column entries that provide
 *                                         a mapping between original column names and their
 *                                         corresponding SQL column names. If null, filtering
 *                                         is based on the keys of the data entries.
 * @param {string | undefined} unwantedColumnsList - A comma-separated string of column names
 *                                                   that should be removed from the dataset.
 * @param {string | undefined} unwantedSubstringsList - A comma-separated string of substrings.
 *                                                      Any column name containing one of these
 *                                                      substrings will be removed from the dataset.
 *
 * @returns {DataEntry[]} - A new array of data entries with the unwanted columns and substrings
 *                          filtered out.
 */
export const filterUnwantedKeys = (
  data: DataEntry[],
  columns: ColumnEntry[] | null,
  unwantedColumnsList: string | undefined,
  unwantedSubstringsList: string | undefined,
): DataEntry[] => {
  const filterColumns = (
    originalColumns: Set<string>,
    unwantedColumns: string[],
    unwantedSubstrings: string[],
  ): Set<string> => {
    return new Set(
      [...originalColumns].filter((column) => {
        if (unwantedColumns.includes(column)) return true;
        if (unwantedSubstrings.some((sub) => column.includes(sub))) return true;
        return false;
      }),
    );
  };

  const unwantedColumns = unwantedColumnsList
    ? unwantedColumnsList.split(",")
    : [];
  const unwantedSubstrings = unwantedSubstringsList
    ? unwantedSubstringsList.split(",")
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
      unwantedSubstrings,
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
      Object.keys(data[0]).filter(
        (key) =>
          !unwantedColumns.includes(key) &&
          !unwantedSubstrings.some((sub) => key.includes(sub)),
      ),
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

const parseDateValue = (value: unknown): number | null => {
  if (value == null || value === "") return null;
  const str = String(value).trim();
  if (!str) return null;
  const num = Number(str);
  if (!Number.isNaN(num) && num > 0) return num;
  const date = new Date(str);
  return Number.isNaN(date.getTime()) ? null : date.getTime();
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
  const minMs = minDate ? parseDateValue(minDate) : null;
  const maxMs = maxDate ? parseDateValue(maxDate) : null;
  if (minDate && minMs == null) return data;
  if (maxDate && maxMs == null) return data;

  return data.filter((item) => {
    const valueMs = parseDateValue(item[timestampColumn]);
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

    return valuesToCheck.some((value) => {
      return (
        typeof value === "string" &&
        (extensions.audio.some((ext) => value.toLowerCase().includes(ext)) ||
          extensions.image.some((ext) => value.toLowerCase().includes(ext)) ||
          extensions.video.some((ext) => value.toLowerCase().includes(ext)))
      );
    });
  });
};
