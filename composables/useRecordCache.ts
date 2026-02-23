import type { DataEntry } from "@/types/types";
import type { Ref, ComputedRef } from "vue";

// Module-level state so all components share a single cache instance.
// Records are keyed by `${table}::${recordId}`.
const cache = new Map<string, DataEntry>();
const pending = new Map<string, Promise<DataEntry | null>>();

// Lazy-initialized reactive counter; avoids calling ref() at import time
// (which would fail in test environments where Vue auto-imports are not yet
// registered on globalThis).
let cacheCount: Ref<number> | null = null;

const ensureCacheCount = (): Ref<number> => {
  if (!cacheCount) {
    cacheCount = ref(0);
  }
  return cacheCount;
};

/**
 * Singleton composable for raw record fetching with caching and request de-duplication.
 * State is module-level so every consumer shares one cache keyed by `table::recordId`.
 */
export const useRecordCache = () => {
  const {
    public: { appApiKey },
  } = useRuntimeConfig();

  const headers = { "x-api-key": appApiKey as string };
  const count = ensureCacheCount();

  /**
   * Fetches a single raw record by table and ID. Returns a cached copy
   * if one exists, otherwise calls the API and caches the result.
   * Concurrent requests for the same record are de-duped.
   *
   * @param {string} table - The dataset table name.
   * @param {string} recordId - The _id of the record to fetch.
   * @returns {Promise<DataEntry | null>} The raw record, or null on 404.
   */
  const fetchRecord = async (
    table: string,
    recordId: string,
  ): Promise<DataEntry | null> => {
    const cacheKey = `${table}::${recordId}`;

    if (cache.has(cacheKey)) {
      return cache.get(cacheKey)!;
    }

    // De-dupe concurrent requests for the same record
    if (pending.has(cacheKey)) {
      return pending.get(cacheKey)!;
    }

    const request = $fetch<DataEntry>(`/api/${table}/${recordId}`, { headers })
      .then((record) => {
        cache.set(cacheKey, record);
        count.value = cache.size;
        return record;
      })
      .catch((error) => {
        if (error?.statusCode === 404) {
          return null;
        }
        console.error(`Failed to fetch record ${recordId}:`, error);
        return null;
      })
      .finally(() => {
        pending.delete(cacheKey);
      });

    pending.set(cacheKey, request);
    return request;
  };

  /**
   * Batch-fetches raw records by IDs, populating the shared cache.
   * Only fetches IDs that are not already cached or in-flight.
   *
   * @param {string} table - The dataset table name.
   * @param {string[]} ids - Array of _id values to fetch.
   * @returns {Promise<DataEntry[]>} All resolved records (cached + freshly fetched).
   */
  const fetchRecords = async (
    table: string,
    ids: string[],
  ): Promise<DataEntry[]> => {
    const results: DataEntry[] = [];
    const idsToFetch: string[] = [];

    // Collect cached hits and identify what needs fetching
    for (const id of ids) {
      const cacheKey = `${table}::${id}`;
      if (cache.has(cacheKey)) {
        results.push(cache.get(cacheKey)!);
      } else {
        idsToFetch.push(id);
      }
    }

    if (idsToFetch.length === 0) {
      return results;
    }

    try {
      const freshRecords = await $fetch<DataEntry[]>(`/api/${table}/records`, {
        method: "POST",
        body: { ids: idsToFetch },
        headers,
      });

      for (const record of freshRecords) {
        if (record._id != null) {
          const cacheKey = `${table}::${String(record._id)}`;
          cache.set(cacheKey, record);
        }
        results.push(record);
      }
      count.value = cache.size;
    } catch (error) {
      console.error("Failed to batch-fetch records:", error);
    }

    return results;
  };

  /**
   * Synchronously returns a cached record, or null if not cached.
   * Useful for template rendering where an async call is not possible.
   *
   * @param {string} table - The dataset table name.
   * @param {string} recordId - The _id of the record.
   * @returns {DataEntry | null} The cached record, or null.
   */
  const getCachedRecord = (
    table: string,
    recordId: string,
  ): DataEntry | null => {
    return cache.get(`${table}::${recordId}`) ?? null;
  };

  /** Removes a single record from the cache, forcing a refetch next time. */
  const invalidateRecord = (table: string, recordId: string) => {
    const cacheKey = `${table}::${recordId}`;
    cache.delete(cacheKey);
    count.value = cache.size;
  };

  /** Clears the entire cache. */
  const clearCache = () => {
    cache.clear();
    count.value = 0;
  };

  // TODO: Evaluate whether cache invalidation should be tied to a TTL,
  // route navigation, or server-sent events. For now, consumers can call
  // clearCache() or invalidateRecord() explicitly.

  const cacheSize: ComputedRef<number> = computed(() => count.value);

  return {
    fetchRecord,
    fetchRecords,
    getCachedRecord,
    invalidateRecord,
    clearCache,
    cacheSize,
  };
};
