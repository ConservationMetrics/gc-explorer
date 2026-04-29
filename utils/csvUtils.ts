/**
 * Escapes a value for safe use in CSV files
 * - Replaces newlines with escaped \n characters
 * - Wraps values containing commas or quotes in double quotes
 * - Escapes internal quotes by doubling them
 */
export const escapeCSVValue = (value: unknown): string => {
  if (value === undefined || value === null) return "";

  let strValue = String(value);

  // Replace actual newlines with escaped \n and \r characters
  strValue = strValue.replace(/\r\n/g, "\\n");
  strValue = strValue.replace(/\n/g, "\\n");
  strValue = strValue.replace(/\r/g, "\\r");

  // Wrap in quotes if contains comma or quote, and escape internal quotes
  if (strValue.includes(",") || strValue.includes('"')) {
    return `"${strValue.replace(/"/g, '""')}"`;
  }

  return strValue;
};

/**
 * Splits comma-separated values into a trimmed non-empty list.
 * Useful for config fields that store list-like values in one text column.
 */
export const splitCsv = (value: string | null | undefined): string[] =>
  (value ?? "")
    .split(",")
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);

/**
 * Builds a CSV string from tabular rows with a fixed header order (like dataset export).
 * Objects and arrays are JSON-stringified for a single cell.
 */
export const buildCsvFromObjects = (
  rows: Array<Record<string, unknown>>,
  headers: string[],
): string => {
  if (headers.length === 0) return "";

  const cell = (value: unknown): string => {
    if (value === undefined || value === null) return escapeCSVValue("");
    if (typeof value === "object") {
      return escapeCSVValue(JSON.stringify(value));
    }
    return escapeCSVValue(value);
  };

  const headerRow = headers.map((h) => escapeCSVValue(h)).join(",");
  const dataRows = rows.map((row) =>
    headers.map((h) => cell(row[h])).join(","),
  );
  return [headerRow, ...dataRows].join("\n");
};
