/**
 * Client-side record cache and request de-duplication for dataset views.
 * Cache is keyed by table + _id. In-flight requests for the same key
 * share one network call.
 *
 * Invalidation: Currently we invalidate only when explicitly called
 * (invalidate(table?, id?) or clear()). A future strategy could tie
 * invalidation to table switch, TTL, or data mutations — see TODO in invalidate().
 */
import type { DataEntry } from "@/types/types";

export type RawRecord = Record<string, unknown>;

const cache = new Map<string, RawRecord>();
const inFlight = new Map<string, Promise<RawRecord | null>>();

/** @param {string} table - Table name. @param {string} id - Record id. @returns {string} Cache key. */
const cacheKey = (table: string, id: string): string => `${table}:${id}`;

/** @returns {Record<string, string>} Headers including x-api-key when configured. */
const getHeaders = (): Record<string, string> => {
  const config = useRuntimeConfig();
  const key = config.public?.appApiKey as string | undefined;
  const headers: Record<string, string> = {};
  if (key) headers["x-api-key"] = key;
  return headers;
};

/**
 * Fetch a single raw record by table and id. Uses cache and de-duplicates
 * in-flight requests for the same table+id.
 * @param {string} table - Table name.
 * @param {string} id - Record _id.
 * @returns {Promise<RawRecord | null>} Raw record or null if not found.
 */
export const getRecord = (
  table: string,
  id: string,
): Promise<RawRecord | null> => {
  const key = cacheKey(table, id);
  const cached = cache.get(key);
  if (cached !== undefined) return Promise.resolve(cached);

  const existing = inFlight.get(key);
  if (existing) return existing;

  const promise = $fetch<RawRecord | null>(
    `/api/${encodeURIComponent(table)}/${encodeURIComponent(String(id))}`,
    { headers: getHeaders() },
  )
    .then((raw) => {
      if (raw != null) cache.set(key, raw);
      inFlight.delete(key);
      return raw;
    })
    .catch((err) => {
      inFlight.delete(key);
      throw err;
    });

  inFlight.set(key, promise);
  return promise;
};

const BULK_MAX = 100;

/**
 * Fetch multiple raw records by table and ids. Uses POST api/[table]/records,
 * then stores each result in the cache so subsequent getRecord() calls hit cache.
 * Returns array in same order as ids; null for missing or beyond first BULK_MAX unique.
 * @param {string} table - Table name.
 * @param {string[]} ids - Record ids.
 * @returns {Promise<(RawRecord | null)[]>} Records in request order (null where missing).
 */
export const getRecords = (
  table: string,
  ids: string[],
): Promise<(RawRecord | null)[]> => {
  const unique = [...new Set(ids)];
  const toFetch = unique.slice(0, BULK_MAX);
  if (toFetch.length === 0) return Promise.resolve(ids.map(() => null));

  return $fetch<{ records: (DataEntry | null)[] }>(
    `/api/${encodeURIComponent(table)}/records`,
    {
      method: "POST",
      body: { ids: toFetch },
      headers: getHeaders(),
    },
  ).then((res) => {
    const records = res.records ?? [];
    const byId = new Map<string, RawRecord | null>();
    records.forEach((r, i) => {
      const id = toFetch[i];
      const raw = r as RawRecord | null;
      byId.set(id, raw);
      if (raw != null) cache.set(cacheKey(table, id), raw);
    });
    return ids.map((id) => byId.get(id) ?? null);
  });
};

/**
 * Invalidate cached records so the next getRecord/getRecords refetches.
 * - invalidate(table, id): remove one record
 * - invalidate(table): remove all records for table
 * - invalidate(): clear entire cache
 * @param {string} [table] - Table name; omit to clear all.
 * @param {string} [id] - Record id; omit to clear whole table.
 * @returns {void}
 * @todo Consider invalidation on table switch, TTL, or after mutations.
 */
export const invalidate = (table?: string, id?: string): void => {
  if (table === undefined) {
    cache.clear();
    return;
  }
  if (id !== undefined) {
    cache.delete(cacheKey(table, id));
    return;
  }
  const prefix = `${table}:`;
  for (const key of cache.keys()) {
    if (key.startsWith(prefix)) cache.delete(key);
  }
};

/** Clear entire cache and in-flight tracking. @returns {void} */
export const clear = (): void => {
  cache.clear();
  inFlight.clear();
};

/**
 * Composable that exposes getRecord, getRecords, invalidate, and clear.
 * @returns {{ getRecord: typeof getRecord; getRecords: typeof getRecords; invalidate: typeof invalidate; clear: typeof clear }}
 */
export const useRecordFetch = () => ({
  getRecord,
  getRecords,
  invalidate,
  clear,
});
