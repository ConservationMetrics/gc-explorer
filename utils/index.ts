/** Extracts file paths with valid extensions from a feature object. */
export const getFilePathsWithExtension = (
  feature: { [key: string]: unknown },
  allExtensions: { [category: string]: string[] },
  mediaColumn?: string,
): string[] => {
  if (!feature) return [];

  const filePaths: string[] = [];
  const keysToProcess = mediaColumn ? [mediaColumn] : Object.keys(feature);

  keysToProcess.forEach((key) => {
    if (typeof feature[key] !== "string") return;
    if (feature[key].includes("attachment")) return;

    const files = feature[key].split(",");
    // handle ["\"5bf52de27e1a7b36f2d2cec254b766c8.jpg\""]

    files.forEach((file: string) => {
      const cleanedFile = file
        .trim()
        .replace(/^[\s"'\\[]+|[\s"'\\[\]]+$/g, "") // Remove brackets, quotes, backslashes, and whitespace from edges
        .replace(/ /g, "_");

      const hasValidExtension = Object.values(allExtensions).some(
        (extensions) =>
          extensions.some((ext: string) => cleanedFile.endsWith(ext)),
      );

      if (hasValidExtension) {
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
 * Converts Title Case (or spaced words) to snake_case
 * @param str - The string to convert (e.g., "Illegal Logging")
 * @returns The snake_case version (e.g., "illegal_logging")
 */
export const titleToSnakeCase = (str: string): string => {
  return str.trim().toLowerCase().replace(/\s+/g, "_");
};

/**
 * Converts snake_case to Title Case
 * @param str - The string to convert (e.g., "illegal_logging")
 * @returns The Title Case version (e.g., "Illegal Logging")
 */
export const snakeToTitleCase = (str: string): string => {
  return str
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
};

/**
 * Converts Title Case (or spaced words) to camelCase
 * @param str - The string to convert (e.g., "Illegal Logging")
 * @returns The camelCase version (e.g., "illegalLogging")
 */
export const titleToCamelCase = (str: string): string => {
  return str
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .map((word, index) =>
      index === 0 ? word : word.charAt(0).toUpperCase() + word.slice(1),
    )
    .join("");
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

/**
 * Character limits for dataset configuration fields
 * @type {Object}
 */
export const CONFIG_LIMITS = {
  /** @type {number} Maximum length for dataset table display name */
  DATASET_TABLE: 100,
  /** @type {number} Maximum length for view description */
  VIEW_DESCRIPTION: 500,
} as const;
