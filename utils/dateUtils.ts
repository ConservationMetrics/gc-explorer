import { format, getDate, isValid } from "date-fns";

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
  return isValid(date) ? date.getTime() : null;
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

/** Formats an ISO-like timestamp string to a locale date string. */
export const formatDate = (date: string): string => {
  const dateRegex = /(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2}).*/;
  const dateMatch = date.match(dateRegex);
  if (dateMatch) {
    return new Date(
      `${dateMatch[1]}-${dateMatch[2]}-${dateMatch[3]}T${dateMatch[4]}:${dateMatch[5]}:${dateMatch[6]}`,
    ).toLocaleDateString();
  }
  return date;
};

/**
 * Formats a Planet monthly basemap date as "YYYY_MM".
 *
 * @param date - Date to format.
 * @returns Planet month identifier.
 */
export const formatPlanetMonth = (date: Date): string => {
  return format(date, "yyyy_MM");
};

/**
 * Returns the latest available Planet monthly basemap.
 * The previous month's basemap becomes available after the 15th.
 *
 * @param date - Date used to determine availability.
 * @returns Latest available Planet month identifier.
 */
export const getPlanetMaxMonth = (date: Date = new Date()): string => {
  const monthsToSubtract = getDate(date) <= 15 ? 2 : 1;
  const maxMonth = new Date(date);
  maxMonth.setMonth(maxMonth.getMonth() - monthsToSubtract);
  return formatPlanetMonth(maxMonth);
};
