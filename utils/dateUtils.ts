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
