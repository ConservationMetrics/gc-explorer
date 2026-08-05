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

export type GalleryMediaType = "audio" | "image" | "video";

/** Media types present on a gallery entry, based on allowed extensions. */
export const getMediaTypesForEntry = (
  feature: { [key: string]: unknown },
  allExtensions: {
    audio: string[];
    image: string[];
    video: string[];
  },
  mediaColumn?: string,
): GalleryMediaType[] => {
  const paths = getFilePathsWithExtension(feature, allExtensions, mediaColumn);
  const types = new Set<GalleryMediaType>();

  for (const path of paths) {
    const ext = path.split(".").pop()?.toLowerCase() ?? "";
    if (!ext) continue;
    if (allExtensions.audio.includes(ext)) types.add("audio");
    if (allExtensions.image.includes(ext)) types.add("image");
    if (allExtensions.video.includes(ext)) types.add("video");
  }

  return Array.from(types);
};

/** Keep entries that include at least one of the selected media types (OR among types). */
export const filterByMediaTypes = <T extends { [key: string]: unknown }>(
  items: T[],
  selectedTypes: GalleryMediaType[],
  allExtensions: {
    audio: string[];
    image: string[];
    video: string[];
  },
  mediaColumn?: string,
): T[] => {
  if (!selectedTypes.length) return items;
  return items.filter((item) => {
    const present = getMediaTypesForEntry(item, allExtensions, mediaColumn);
    return present.some((type) => selectedTypes.includes(type));
  });
};

const CLEAN_PHOTO_TOKEN_EDGES = /^[\s"'\\[]+|[\s"'\\[\]]+$/g;

/**
 * Parses Mapeo / survey photo list strings (comma-separated and/or bracket-wrapped).
 */
export const parsePhotoListString = (raw: unknown): string[] => {
  if (raw == null || raw === "") return [];
  return String(raw)
    .split(",")
    .map((file) =>
      file.trim().replace(CLEAN_PHOTO_TOKEN_EDGES, "").replace(/ /g, "_"),
    )
    .filter(Boolean);
};

/**
 * Resolves `photos` (display-transformed) or `_photos` (raw Mapeo) into file paths.
 */
export const parsePhotosFromRecord = (
  record: Record<string, unknown>,
): string[] => parsePhotoListString(record.photos ?? record._photos);

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

/** Generates a random hex color code. */
export const getRandomColor = () => {
  const letters = "0123456789ABCDEF";
  let color = "#";
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
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
