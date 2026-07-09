import type { GalleryAttachment } from "@/types";

const ATTACHMENT_FIELD_NAMES = ["_attachments", "attachments"];

/**
 * Reads the first non-empty string value from an object using candidate keys.
 *
 * @param {Record<string, unknown>} item - Attachment object from survey data.
 * @param {string[]} keys - Candidate property names.
 * @returns {string | undefined} Matching string value.
 */
const readAttachmentString = (
  item: Record<string, unknown>,
  keys: string[],
): string | undefined => {
  for (const key of keys) {
    const value = item[key];
    if (typeof value === "string" && value.trim() !== "") {
      return value;
    }
  }
  return undefined;
};

/**
 * Formats an attachment filename for display.
 *
 * @param {string} rawName - Basename or full attachment path.
 * @returns {string} Human-readable filename.
 */
const formatAttachmentName = (rawName: string): string => {
  const basename = rawName.split("/").pop() || rawName;
  return basename.replace(/_/g, " ");
};

/**
 * Parses `_attachments` / `attachments` JSON from a raw survey record into
 * structured gallery attachment entries.
 *
 * @param {Record<string, unknown>} record - Raw full gallery record.
 * @returns {GalleryAttachment[]} Parsed attachment metadata.
 */
export const parseGalleryAttachments = (
  record: Record<string, unknown>,
): GalleryAttachment[] => {
  let rawValue: unknown;
  for (const fieldName of ATTACHMENT_FIELD_NAMES) {
    const candidate = record[fieldName];
    if (candidate != null && candidate !== "") {
      rawValue = candidate;
      break;
    }
  }

  if (rawValue == null) return [];

  let parsed: unknown;
  if (typeof rawValue === "string") {
    try {
      parsed = JSON.parse(rawValue);
    } catch {
      return [];
    }
  } else if (Array.isArray(rawValue)) {
    parsed = rawValue;
  } else {
    return [];
  }

  if (!Array.isArray(parsed)) return [];

  return parsed
    .filter(
      (item): item is Record<string, unknown> =>
        typeof item === "object" && item !== null,
    )
    .map((item) => {
      const rawName =
        readAttachmentString(item, [
          "media_file_basename",
          "media file basename",
          "filename",
        ]) ?? "Attachment";

      return {
        name: formatAttachmentName(rawName),
        mimetype: readAttachmentString(item, ["mimetype"]),
        questionXpath: readAttachmentString(item, [
          "question_xpath",
          "question xpath",
        ]),
        downloadUrl: readAttachmentString(item, [
          "download_url",
          "download url",
        ]),
        downloadLargeUrl: readAttachmentString(item, [
          "download_large_url",
          "download large url",
        ]),
        downloadMediumUrl: readAttachmentString(item, [
          "download_medium_url",
          "download medium url",
        ]),
        downloadSmallUrl: readAttachmentString(item, [
          "download_small_url",
          "download small url",
        ]),
        id: item.id as number | string | undefined,
        uid: readAttachmentString(item, ["uid"]),
      };
    })
    .filter((attachment) => attachment.downloadUrl || attachment.name);
};
