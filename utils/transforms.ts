import type { DataEntry } from "@/types/types";

/**
 * Capitalizes the first letter of each word in a string.
 *
 * @param {string} value - The string to capitalize.
 * @returns {string} The string with each word's first letter capitalized.
 */
export const capitalizeFirstLetter = (value: string): string => {
  return value
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
};

/**
 * Transforms a raw survey data key into a human-readable display label.
 * Removes internal prefixes (g__, p__), replaces underscores with spaces,
 * and standardizes known key names (e.g. "today" → "dataCollectedOn").
 *
 * @param {string} key - The raw database column key.
 * @param {string} [iconColumn] - Optional icon column name to preserve unchanged.
 * @returns {string} The transformed display-ready key.
 */
export const transformSurveyDataKey = (
  key: string,
  iconColumn?: string,
): string => {
  if (iconColumn && key === iconColumn) {
    return key;
  }

  let transformedKey = key
    .replace(/^g__/, "geo")
    .replace(/^p__/, "")
    .replace(/_/g, " ");
  if (transformedKey.toLowerCase() === "today") {
    transformedKey = "dataCollectedOn";
  } else if (transformedKey.toLowerCase().includes("categoryid")) {
    transformedKey = "category";
  } else if (transformedKey.toLowerCase() === "id") {
    transformedKey = "id";
  }
  return transformedKey.trimStart();
};

/**
 * Transforms a raw survey data value into a human-readable display value.
 * Replaces underscores and semicolons, capitalizes the first letter,
 * and formats bracket-enclosed lists.
 *
 * @param {string} key - The raw database column key (used for context-specific transforms).
 * @param {string | number | null} value - The raw value to transform.
 * @param {string} [iconColumn] - Optional icon column name whose values are preserved unchanged.
 * @returns {string | number | null} The transformed display-ready value.
 */
export const transformSurveyDataValue = (
  key: string,
  value: string | number | null,
  iconColumn?: string,
): string | number | null => {
  if (value === null) return null;
  if (key === "g__coordinates") return value;
  if (iconColumn && key === iconColumn) return value;

  let transformedValue = value;
  if (typeof transformedValue === "string") {
    transformedValue = transformedValue.replace(/_/g, " ").replace(/;/g, ", ");
    if (key.toLowerCase().includes("category")) {
      transformedValue = transformedValue.replace(/-/g, " ");
    }
    transformedValue =
      transformedValue.charAt(0).toUpperCase() + transformedValue.slice(1);
  }
  // Handle lists enclosed in square brackets
  if (
    typeof transformedValue === "string" &&
    transformedValue.match(/^\[.*\]$/)
  ) {
    transformedValue = transformedValue
      .replace(/^\[|\]$/g, "")
      .split(", ")
      .map((item) => item.replace(/'/g, ""))
      .join(", ");
  }
  return transformedValue;
};

/**
 * Transforms survey data by modifying keys and values to a more readable format.
 *
 * This function processes an array of survey data entries, transforming both the keys
 * and values of each entry to enhance readability and consistency. The transformation
 * includes:
 * - Modifying key names by removing prefixes, replacing underscores with spaces, and
 *   standardizing certain key names (e.g., "today" becomes "dataCollectedOn").
 * - Adjusting value formats by replacing underscores and semicolons with spaces and commas,
 *   respectively, capitalizing the first letter, and formatting date-related values.
 * - Handling lists enclosed in square brackets by removing brackets and quotes, and
 *   joining items with commas.
 *
 * Applied client-side at render time so that downloads can access untransformed records.
 *
 * @param {DataEntry[]} data - An array of survey data entries to be transformed.
 * @param {string} [iconColumn] - Optional icon column name to exclude from transformation.
 * @returns {DataEntry[]} A new array of data entries with transformed keys and values.
 */
export const transformSurveyData = (
  data: DataEntry[],
  iconColumn?: string,
): DataEntry[] => {
  return data.map((entry) => {
    const transformedEntry: DataEntry = {};
    Object.entries(entry).forEach(([key, value]) => {
      const transformedKey =
        iconColumn && key === iconColumn
          ? key
          : transformSurveyDataKey(key, iconColumn);
      const transformedValue = transformSurveyDataValue(key, value, iconColumn);
      if (transformedValue !== null) {
        transformedEntry[transformedKey] = String(transformedValue);
      }
    });
    return transformedEntry;
  });
};

/**
 * Convenience wrapper around transformSurveyData for single-record use that transforms a single raw data entry into human-readable format.
 *
 * @param {DataEntry} entry - A single raw database row.
 * @param {string} [iconColumn] - Optional icon column name to preserve unchanged.
 * @returns {DataEntry} The transformed entry with readable keys and values.
 */
export const transformRecord = (
  entry: DataEntry,
  iconColumn?: string,
): DataEntry => {
  return transformSurveyData([entry], iconColumn)[0];
};
