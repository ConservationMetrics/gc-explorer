import { hasValidCoordinates } from "./helpers";

import type {
  ColumnEntry,
  DataEntry,
  AllowedFileExtensions,
} from "@/types/types";

/**
 * Filters out unwanted columns and substrings from the provided data entries.
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

  if (columns && columns.length > 0) {
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
  } else if (data.length > 0) {
    filteredSqlColumns = new Set(
      Object.keys(data[0]).filter(
        (key) =>
          !unwantedColumns.includes(key) &&
          !unwantedSubstrings.some((sub) => key.includes(sub)),
      ),
    );
  } else {
    return [];
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
