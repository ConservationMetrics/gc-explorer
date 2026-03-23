/**
 * Parses a value to milliseconds since epoch.
 * Accepts numeric timestamps (ms) or date strings (ISO or parseable by Date).
 *
 * @param value - Raw value (string, number, or unknown).
 * @returns Milliseconds since epoch, or null if unparseable.
 */
export const parseDateMs = (value: unknown): number | null => {
  if (value == null || value === "") return null;
  const str = String(value).trim();
  if (!str) return null;
  const num = Number(str);
  if (!Number.isNaN(num) && num > 0) return num;
  const date = new Date(str);
  return Number.isNaN(date.getTime()) ? null : date.getTime();
};

/**
 * Formats a date string to a locale date string.
 *
 * @param month - The month (1-12).
 * @param year - The year (4 digits).
 * @param day - The day (1-31). Optional.
 * @returns The formatted date string.
 */
export const formatLocaleDate = (
  month: string | number,
  year: string | number,
  day?: string | number | null,
): string => {
  const mm = String(month).padStart(2, "0");
  return day
    ? `${String(day).padStart(2, "0")}-${mm}-${year}`
    : `${mm}-${year}`;
};
