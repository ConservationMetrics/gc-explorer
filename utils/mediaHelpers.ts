import type {
  AllowedFileExtensions,
  GalleryMediaType,
  MediaTypeFilterValue,
} from "@/types";

/**
 * Extracts the share ID from a Filebrowser share URL or returns the input if it's already a hash.
 * @example
 * // "https://files.demo.guardianconnector.net/share/abc123" → "abc123"
 * @example
 * // "https://files.demo.guardianconnector.net/api/public/dl/abc123" → "abc123"
 * @example
 * // "abc123" → "abc123"
 */
export const extractShareId = (input: string): string => {
  if (!input || !input.trim()) return "";

  try {
    const u = new URL(input);
    // Handles /share/{id}, /api/public/dl/{id}, with or without trailing slash
    const parts = u.pathname.split("/").filter(Boolean);
    const idx = Math.max(parts.indexOf("share"), parts.indexOf("dl"));
    if (idx !== -1 && parts[idx + 1]) return parts[idx + 1];
  } catch {
    /* not a URL, fall through */
  }

  // Raw hash
  return input.trim();
};

/**
 * Derives the files origin from the current hostname.
 * Examples:
 * - explorer.demo.guardianconnector.net → files.demo.guardianconnector.net
 * - demo.guardianconnector.net → files.demo.guardianconnector.net
 * Note that this assumes that Filebrowser will always be used with the same hostname and with a `files` subdomain. Please see https://github.com/ConservationMetrics/gc-deploy for more information on this deployment pattern.
 */
export const deriveFilesOrigin = (hostname: string): string => {
  if (!hostname) return "";

  const parts = hostname.split(".");
  if (parts.length > 2) {
    parts[0] = "files"; // explorer.foo.bar → files.foo.bar
  } else {
    parts.unshift("files"); // foo.bar → files.foo.bar
  }
  return `https://${parts.join(".")}`;
};

/**
 * Builds a Filebrowser base URL from an origin.
 * Ensures the URL ends with /api/public/dl/
 * @example
 * // "https://files.demo.guardianconnector.net" → "https://files.demo.guardianconnector.net/api/public/dl/"
 * @example
 * // "https://files.demo.guardianconnector.net/" → "https://files.demo.guardianconnector.net/api/public/dl/"
 */
export const buildFilebrowserBase = (origin: string): string => {
  if (!origin) return "";
  return `${origin.replace(/\/+$/, "")}/api/public/dl/`;
};

/**
 * Validation regex for Filebrowser inputs.
 * Matches:
 * - https://files.example.com/share/{hash}
 * - https://files.example.com/api/public/dl/{hash}
 * - Raw hash (alphanumeric, hyphens, underscores)
 */
export const filebrowserInputRegex =
  /^(https?:\/\/[^\s]+\/(?:share|api\/public\/dl)\/[a-zA-Z0-9_-]+|[a-zA-Z0-9_-]+)$/;

/**
 * Validates Filebrowser input format.
 * @example
 * // Valid: "https://files.example.com/share/abc123"
 * // Valid: "https://files.example.com/api/public/dl/abc123"
 * // Valid: "abc123"
 * // Valid: "" (empty)
 * // Invalid: "invalid input with spaces!"
 */
export const isValidFilebrowserInput = (input: string): boolean => {
  if (!input.trim()) return true;
  if (input.includes("/")) {
    return filebrowserInputRegex.test(input.trim());
  }
  return /^[a-zA-Z0-9_-]+$/.test(input.trim());
};

/**
 * Extracts base URL from input if it's a full URL, otherwise uses default.
 * @example
 * // "https://files.demo.guardianconnector.net/share/abc123", "https://files.localhost/api/public/dl/"
 * // → "https://files.demo.guardianconnector.net/api/public/dl/"
 * @example
 * // "https://files.demo.guardianconnector.net/api/public/dl/abc123", "https://files.localhost/api/public/dl/"
 * // → "https://files.demo.guardianconnector.net/api/public/dl/"
 * @example
 * // "abc123" (raw hash), "https://files.localhost/api/public/dl/"
 * // → "https://files.localhost/api/public/dl/"
 */
const MIME_BY_EXTENSION: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  gif: "image/gif",
  svg: "image/svg+xml",
  webp: "image/webp",
};

/**
 * Infers an image Content-Type from a URL's file extension, falling back to the
 * supplied value (typically `response.headers.get('content-type')`) and finally
 * to `application/octet-stream`.
 *
 * Used by the icon proxy because Filebrowser's `/api/public/dl/` endpoint
 * serves `application/octet-stream`, which the browser refuses to render in an
 * `<img>` (notably breaks `.svg`).
 * @example
 * // "https://files.example.com/api/public/dl/abc/icon.svg", null → "image/svg+xml"
 */
export const inferContentType = (
  url: string,
  fallback: string | null,
): string => {
  try {
    const ext = new URL(url).pathname.split(".").pop()?.toLowerCase();
    if (ext && MIME_BY_EXTENSION[ext]) return MIME_BY_EXTENSION[ext];
  } catch {
    /* not a valid URL — fall through */
  }
  return fallback ?? "application/octet-stream";
};

export const getBaseUrlFromInput = (
  input: string,
  defaultBaseUrl: string,
): string => {
  if (!input || !input.trim()) return defaultBaseUrl;

  try {
    const u = new URL(input);
    if (u.pathname.includes("/share/")) {
      return `${u.origin}/api/public/dl/`;
    }
    if (u.pathname.includes("/api/public/dl/")) {
      return `${u.origin}/api/public/dl/`;
    }
  } catch {
    // Not a URL, use default
  }

  return defaultBaseUrl;
};

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

export const getMediaTypesForEntry = (
  feature: { [key: string]: unknown },
  allExtensions: AllowedFileExtensions,
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

export const getMediaTypeFilterOptions = <T extends { [key: string]: unknown }>(
  items: T[],
  allExtensions: AllowedFileExtensions,
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

export const filterByMediaTypes = <T extends { [key: string]: unknown }>(
  items: T[],
  selectedTypes: MediaTypeFilterValue[],
  allExtensions: AllowedFileExtensions,
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

