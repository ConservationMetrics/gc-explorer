/**
 * Converts CamelCase to snake_case, aligned with gc-scripts-hub
 * `f/common_logic/identifier_utils.py` `camel_to_snake`.
 *
 * @see https://stackoverflow.com/questions/1175208/elegant-python-function-to-convert-camelcase-to-snake-case
 */
const CAMEL_TO_SNAKE_PATTERN = /(?<=[a-z])(?=[A-Z])|(?<=[A-Z])(?=[A-Z][a-z])/g;

export const camelToSnake = (name: string): string => {
  return name.replace(CAMEL_TO_SNAKE_PATTERN, "_").toLowerCase();
};

/** Converts a string to camelCase format. */
export const toCamelCase = (key: string): string => {
  return key
    .toLowerCase()
    .replace(/_([a-z0-9])/g, (_, p1: string) => p1.toUpperCase())
    .replace(/(^\w)/, (match) => match.toLowerCase());
};

/** Replaces underscores with spaces (e.g. table slug for display). */
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
