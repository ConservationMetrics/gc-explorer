/**
 * Strips combining diacritical marks after NFD normalization (ASCII-friendly identifiers).
 *
 * @param value - Raw string.
 * @returns The string without combining marks.
 */
const stripCombiningMarks = (value: string): string => {
  return value.normalize("NFD").replace(/\p{M}/gu, "");
};

/**
 * Produces a short filesystem-safe segment from a user-facing label (e.g. incident name in download filenames).
 * Strips combining marks, keeps alphanumerics plus hyphen and underscore, replaces other characters with underscores, then truncates.
 *
 * @param value - Raw label.
 * @param maxLength - Maximum length after sanitization.
 * @param fallback - Used when the sanitized result is empty.
 * @returns Safe segment for use in filenames.
 */
export const sanitizeFilenameSegment = (
  value: string,
  maxLength = 80,
  fallback = "incident",
): string => {
  const asciiish = stripCombiningMarks(value);
  const cleaned = asciiish.replace(/[^a-z0-9-_]+/gi, "_").slice(0, maxLength);
  return cleaned || fallback;
};
