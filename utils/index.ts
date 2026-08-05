const normalizeExtension = (ext: string): string =>
  ext.toLowerCase().replace(/^\./, "");

const fileNameHasExtension = (fileName: string, ext: string): boolean => {
  const suffix = normalizeExtension(ext);
  return fileName.toLowerCase().endsWith(`.${suffix}`);
};

const extensionListIncludes = (list: string[] = [], ext: string): boolean =>
  list.some((candidate) => normalizeExtension(candidate) === ext);

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
          extensions.some((ext: string) =>
            fileNameHasExtension(cleanedFile, ext),
          ),
      );

      if (hasValidExtension) {
        filePaths.push(cleanedFile);
      }
    });
  });

  return filePaths;
};

/** Media kinds that map to allowed file extensions (not filter-only options). */
export type GalleryMediaType = "audio" | "image" | "video";

/** Media type filter selections; `"none"` = entry has no classified media files. */
export type MediaTypeFilterValue = GalleryMediaType | "none";

type MediaExtensionConfig = {
  audio: string[];
  image: string[];
  video: string[];
};

/** Media types present on an entry, based on allowed extensions. */
export const getMediaTypesForEntry = (
  feature: { [key: string]: unknown },
  allExtensions: MediaExtensionConfig,
  mediaColumn?: string,
): GalleryMediaType[] => {
  const paths = getFilePathsWithExtension(feature, allExtensions, mediaColumn);
  const types = new Set<GalleryMediaType>();

  for (const path of paths) {
    const ext = path.split(".").pop()?.toLowerCase() ?? "";
    if (!ext) continue;
    if (extensionListIncludes(allExtensions.audio, ext)) types.add("audio");
    if (extensionListIncludes(allExtensions.image, ext)) types.add("image");
    if (extensionListIncludes(allExtensions.video, ext)) types.add("video");
  }

  return Array.from(types);
};

/**
 * Checkbox options for MediaTypeFilter: configured media kinds, plus `"none"`
 * only when some row has no classifiable media.
 */
export const getMediaTypeFilterOptions = <T extends { [key: string]: unknown }>(
  items: T[],
  allExtensions: MediaExtensionConfig,
  mediaColumn?: string,
): MediaTypeFilterValue[] => {
  const options: MediaTypeFilterValue[] = [];
  if (allExtensions.image?.length) options.push("image");
  if (allExtensions.audio?.length) options.push("audio");
  if (allExtensions.video?.length) options.push("video");

  const hasNone = items.some(
    (item) =>
      getMediaTypesForEntry(item, allExtensions, mediaColumn).length === 0,
  );
  if (hasNone) options.push("none");

  return options;
};

/**
 * Keep entries that match any selected option (OR among selections).
 * `"none"` matches entries with no classified media files.
 */
export const filterByMediaTypes = <T extends { [key: string]: unknown }>(
  items: T[],
  selectedTypes: MediaTypeFilterValue[],
  allExtensions: MediaExtensionConfig,
  mediaColumn?: string,
): T[] => {
  if (!selectedTypes.length) return items;
  return items.filter((item) => {
    const present = getMediaTypesForEntry(item, allExtensions, mediaColumn);
    return selectedTypes.some((type) => {
      if (type === "none") return present.length === 0;
      return present.includes(type);
    });
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
