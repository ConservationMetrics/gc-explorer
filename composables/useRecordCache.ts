import type { DataEntry } from "@/types/types";

/**
 * Client-side cache and fetcher for individual raw records, keyed by
 * `${table}::${recordId}`. Avoids repeated network requests when the
 * same record is clicked/viewed multiple times.
 *
 * @returns {{ fetchRecord, clearCache, cacheSize }} Cache operations and state.
 */
export const useRecordCache = () => {
  const cache = new Map<string, DataEntry>();
  const cacheCount = ref(0);
  const pending = new Map<string, Promise<DataEntry | null>>();

  const {
    public: { appApiKey },
  } = useRuntimeConfig();

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

    const request = $fetch<DataEntry>(`/api/${table}/${recordId}`, {
      headers: { "x-api-key": appApiKey as string },
    })
      .then((record) => {
        cache.set(cacheKey, record);
        cacheCount.value = cache.size;
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

  const clearCache = () => {
    cache.clear();
    cacheCount.value = 0;
  };

  const cacheSize = computed(() => cacheCount.value);

  return { fetchRecord, clearCache, cacheSize };
};
