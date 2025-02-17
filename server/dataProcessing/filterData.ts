import type { ColumnEntry, DataEntry, AllowedFileExtensions } from "../types";
import { hasValidCoordinates } from "./helpers";

// Filter out unwanted columns and substrings
// Use SQL column mapping if available
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

  // Split the unwantedColumns and unwantedSubstrings from .env
  const unwantedColumns = unwantedColumnsList
    ? unwantedColumnsList.split(",")
    : [];
  const unwantedSubstrings = unwantedSubstringsList
    ? unwantedSubstringsList.split(",")
    : [];

  let filteredSqlColumns: Set<string>;

  // If there is a __columns table, use that for SQL column mapping and filtering
  if (columns) {
    // Create an original-to-SQL column mapping for lookup
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

    // Map the unwanted original_column entries to sql_column entries
    const unwantedSqlColumns = new Set(
      [...unwantedColumnsSet].map((column) => columnMapping[column]),
    );

    // Filter out the unwanted sql_column entries
    filteredSqlColumns = new Set(
      Object.values(columnMapping).filter(
        (sqlColumn) => !unwantedSqlColumns.has(sqlColumn),
      ),
    );
  } else {
    // If there is no __columns table, then filter based on Object keys of one data entry
    filteredSqlColumns = new Set(
      Object.keys(data[0]) // assuming data has at least one item
        .filter(
          (key) =>
            !unwantedColumns.includes(key) &&
            !unwantedSubstrings.some((sub) => key.includes(sub)),
        ),
    );
  }

  // Create new filtered dataset
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

// Filter out data that matches a comma-separated list of values for a given column
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

// Filter out data without columns storing have valid coordinates
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

// Filter out data without any columns storing file extensions
export const filterDataByExtension = (
  data: DataEntry[],
  extensions: AllowedFileExtensions,
): DataEntry[] => {
  return data.filter((entry) => {
    return Object.values(entry).some((value) => {
      return (
        typeof value === "string" &&
        (extensions.audio.some((ext) => value.toLowerCase().includes(ext)) ||
          extensions.image.some((ext) => value.toLowerCase().includes(ext)) ||
          extensions.video.some((ext) => value.toLowerCase().includes(ext)))
      );
    });
  });
};
