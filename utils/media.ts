/**
 * Extracts the share ID from a Filebrowser share URL or returns the input if it's already a hash.
 * Handles URLs in formats:
 * - https://files.{slug}.guardianconnector.net/share/{id}
 * - https://files.{slug}.guardianconnector.net/api/public/dl/{id}
 * - Raw hash string
 */
export function extractShareId(input: string): string {
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
}

/**
 * Derives the files origin from the current hostname.
 * Examples:
 * - explorer.demo.guardianconnector.net → files.demo.guardianconnector.net
 * - demo.guardianconnector.net → files.demo.guardianconnector.net
 */
export function deriveFilesOrigin(hostname: string): string {
  if (!hostname) return "";

  const parts = hostname.split(".");
  if (parts.length > 2) {
    parts[0] = "files"; // explorer.foo.bar → files.foo.bar
  } else {
    parts.unshift("files"); // foo.bar → files.foo.bar
  }
  return `https://${parts.join(".")}`;
}

/**
 * Builds a Filebrowser base URL from an origin.
 * Ensures the URL ends with /api/public/dl/
 */
export function buildFilebrowserBase(origin: string): string {
  if (!origin) return "";
  return `${origin.replace(/\/+$/, "")}/api/public/dl/`;
}

