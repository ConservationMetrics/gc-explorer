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
