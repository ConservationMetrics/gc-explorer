import { useRuntimeConfig } from "#imports";
import type { H3Event } from "h3";

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

/**
 * Parses a comma-separated secondary dataset list into a normalized array.
 * Keeps first occurrence order, removes blanks, deduplicates, and enforces max.
 */
export const getSecondaryDatasets = (input: unknown, max = 2): string[] => {
  if (typeof input !== "string" || max <= 0) {
    return [];
  }

  const values = input
    .split(",")
    .map((value) => value.trim())
    .filter((value) => value.length > 0);

  const unique: string[] = [];
  for (const value of values) {
    if (!unique.includes(value)) {
      unique.push(value);
    }
  }

  return unique.slice(0, max);
};

/**
 * Converts secondary datasets to storage form for `view_config_map.secondary_datasets`.
 */
export const normalizeSecondaryDatasets = (
  input: unknown,
  max = 2,
): string | null => {
  const datasets = getSecondaryDatasets(input, max);
  return datasets.length > 0 ? datasets.join(",") : null;
};
