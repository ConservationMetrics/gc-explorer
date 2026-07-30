import { useRuntimeConfig } from "#imports";
import type { H3Event } from "h3";
import {
  decodeDatasetNameFromUrl,
  normalizeTableName,
} from "@/utils/identifierUtils";

/**
 * Reads and normalizes the `[table]` path param (percent-decode + strip quotes).
 */
export const getTableParam = (event: H3Event): string => {
  const table = event.context.params?.table as string | undefined;
  if (!table) {
    throw Object.assign(new Error("Missing table path parameter"), {
      statusCode: 400,
    });
  }
  return normalizeTableName(table);
};

/**
 * Reads and percent-decodes the `[recordId]` path param.
 * Matches client `encodeURIComponent(recordId)` on `/api/:table/:recordId`.
 */
export const getRecordIdParam = (event: H3Event): string => {
  const raw = event.context.params?.recordId;
  if (typeof raw !== "string" || !raw.trim()) {
    throw Object.assign(new Error("Invalid record ID"), {
      statusCode: 400,
    });
  }
  const recordId = decodeDatasetNameFromUrl(raw).trim();
  if (!recordId) {
    throw Object.assign(new Error("Invalid record ID"), {
      statusCode: 400,
    });
  }
  return recordId;
};

/**
 * Validates a raw `limit` query value against `maxLimit`.
 * Returns the validated integer or throws an error with `statusCode: 422`.
 */
export const validateRowLimit = (raw: unknown, maxLimit: number): number => {
  const limit = raw != null ? Number(raw) : maxLimit;

  if (!Number.isInteger(limit) || limit <= 0) {
    throw Object.assign(new Error("limit must be a positive integer"), {
      statusCode: 422,
    });
  }

  if (limit > maxLimit) {
    throw Object.assign(
      new Error(
        `Requested limit (${limit}) exceeds server maximum of ${maxLimit}`,
      ),
      { statusCode: 422 },
    );
  }

  return limit;
};

/**
 * Reads the `?limit` query param from an H3 event, validates it against the
 * server row ceiling, and returns the validated limit.
 * Throws an error with `statusCode: 422` for invalid or excessive values.
 */
export const parseAndValidateLimit = (event: H3Event): number => {
  const raw = getQuery(event).limit;
  const maxLimit = Number(useRuntimeConfig(event).public.rowLimit);
  return validateRowLimit(raw, maxLimit);
};
