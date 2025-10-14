/** Extracts file paths with valid extensions from a feature object. */
export const getFilePathsWithExtension = (
  feature: { [key: string]: unknown },
  allExtensions: { [category: string]: string[] },
): string[] => {
  if (!feature) return [];

  const filePaths: string[] = [];
  Object.keys(feature).forEach((key) => {
    if (typeof feature[key] !== "string") return;
    if (feature[key].includes("attachment")) return;

    const files = feature[key].split(",");

    files.forEach((file: string) => {
      const hasValidExtension = Object.values(allExtensions).some(
        (extensions) =>
          extensions.some((ext: string) => file.trim().endsWith(ext)),
      );

      if (hasValidExtension) {
        const cleanedFile = file
          .trim()
          .replace(/ /g, "_")
          .replace(/^\['|'\]$/g, "");

        filePaths.push(cleanedFile);
      }
    });
  });
  return filePaths;
};

/** Converts a string to camelCase format. */
export const toCamelCase = (key: string): string => {
  return key
    .toLowerCase()
    .replace(/_([a-z0-9])/g, (_, p1) => p1.toUpperCase())
    .replace(/(^\w)/, (match) => match.toLowerCase());
};

/** Converts a string to snake_case format. */
export const replaceUnderscoreWithSpace = (str: string): string => {
  return str.replace(/_/g, " ");
};

/**
 * Formats a string for display by converting camelCase, kebab-case, and snake_case to Title Case
 * Transforms various naming conventions into a human-readable format
 *
 * @param {string} str - The string to format
 * @returns {string} The formatted string (e.g., "anyone" → "Public", "signed-in" → "Signed In", "camelCase" → "Camel Case")
 */
export const formatDisplayName = (str: string): string => {
  // Special case for "anyone" permission level to show as "Public"
  if (str === "anyone") {
    return "Public";
  }

  return str
    .replace(/([A-Z])/g, " $1") // Add space before capital letters
    .replace(/[-_]/g, " ") // Replace dashes and underscores with spaces
    .trim() // Remove leading/trailing spaces
    .replace(/\s+/g, " ") // Replace multiple spaces with single space
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()) // Capitalize each word
    .join(" ");
};
