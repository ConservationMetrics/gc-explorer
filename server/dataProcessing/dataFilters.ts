import { hasValidCoordinates } from "@/utils/geoUtils";
import { parseDateMs } from "@/utils/dateUtils";

import type { DataEntry, AllowedFileExtensions } from "@/types";

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
