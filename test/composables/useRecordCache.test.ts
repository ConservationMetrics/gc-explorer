import { describe, it, expect, vi, beforeEach } from "vitest";
import { ref, computed } from "vue";

// Mock useRuntimeConfig and Vue auto-imports globally (Nuxt auto-import)
Object.assign(globalThis, {
  ref,
  computed,
  useRuntimeConfig: () => ({
    public: { appApiKey: "test-key" },
  }),
});

// Mock $fetch
const mockFetch = vi.fn();
Object.assign(globalThis, { $fetch: mockFetch });

// Re-import after mocks so module-level state is fresh per describe block
let useRecordCache: typeof import("@/composables/useRecordCache").useRecordCache;

beforeEach(async () => {
  vi.clearAllMocks();

  // Re-import to reset module-level singleton state between tests
  vi.resetModules();
  const mod = await import("@/composables/useRecordCache");
  useRecordCache = mod.useRecordCache;
});

describe("useRecordCache", () => {
  it("fetches a record from the API on first call", async () => {
    const mockRecord = { _id: "abc", name: "Test" };
    mockFetch.mockResolvedValue(mockRecord);

    const { fetchRecord } = useRecordCache();
    const result = await fetchRecord("my_table", "abc");

    expect(result).toEqual(mockRecord);
    expect(mockFetch).toHaveBeenCalledWith("/api/my_table/abc", {
      headers: { "x-api-key": "test-key" },
    });
  });

  it("returns cached record on subsequent calls without hitting the API", async () => {
    const mockRecord = { _id: "abc", name: "Cached" };
    mockFetch.mockResolvedValue(mockRecord);

    const { fetchRecord } = useRecordCache();

    const first = await fetchRecord("my_table", "abc");
    const second = await fetchRecord("my_table", "abc");

    expect(first).toEqual(mockRecord);
    expect(second).toEqual(mockRecord);
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it("de-dupes concurrent requests for the same record", async () => {
    const mockRecord = { _id: "abc", name: "Deduped" };
    mockFetch.mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve(mockRecord), 50)),
    );

    const { fetchRecord } = useRecordCache();

    // Fire two concurrent requests
    const [first, second] = await Promise.all([
      fetchRecord("my_table", "abc"),
      fetchRecord("my_table", "abc"),
    ]);

    expect(first).toEqual(mockRecord);
    expect(second).toEqual(mockRecord);
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it("returns null on 404", async () => {
    mockFetch.mockRejectedValue({ statusCode: 404 });

    const { fetchRecord } = useRecordCache();
    const result = await fetchRecord("my_table", "missing");

    expect(result).toBeNull();
  });

  it("returns null on network error", async () => {
    mockFetch.mockRejectedValue(new Error("Network error"));

    const { fetchRecord } = useRecordCache();
    const result = await fetchRecord("my_table", "abc");

    expect(result).toBeNull();
  });

  it("caches records per table separately", async () => {
    const recordA = { _id: "abc", table: "table_a" };
    const recordB = { _id: "abc", table: "table_b" };

    mockFetch.mockResolvedValueOnce(recordA).mockResolvedValueOnce(recordB);

    const { fetchRecord } = useRecordCache();

    const resultA = await fetchRecord("table_a", "abc");
    const resultB = await fetchRecord("table_b", "abc");

    expect(resultA).toEqual(recordA);
    expect(resultB).toEqual(recordB);
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it("clears the cache and forces refetch", async () => {
    const mockRecord = { _id: "abc", name: "Clearable" };
    mockFetch.mockResolvedValue(mockRecord);

    const { fetchRecord, clearCache, cacheSize } = useRecordCache();

    await fetchRecord("my_table", "abc");
    expect(cacheSize.value).toBe(1);

    clearCache();
    expect(cacheSize.value).toBe(0);

    // Should fetch again after clearing
    await fetchRecord("my_table", "abc");
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });
});

describe("useRecordCache - singleton sharing", () => {
  it("shares cached records across multiple useRecordCache() calls", async () => {
    const mockRecord = { _id: "shared", name: "Shared Record" };
    mockFetch.mockResolvedValue(mockRecord);

    const cacheA = useRecordCache();
    const cacheB = useRecordCache();

    await cacheA.fetchRecord("my_table", "shared");

    // cacheB should see the same record without an API call
    const result = await cacheB.fetchRecord("my_table", "shared");

    expect(result).toEqual(mockRecord);
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it("reflects cache size across instances", async () => {
    mockFetch.mockResolvedValue({ _id: "x", name: "X" });

    const cacheA = useRecordCache();
    const cacheB = useRecordCache();

    await cacheA.fetchRecord("t", "x");

    expect(cacheA.cacheSize.value).toBe(1);
    expect(cacheB.cacheSize.value).toBe(1);
  });
});

describe("useRecordCache - bulk fetch", () => {
  it("batch-fetches records and caches them", async () => {
    const records = [
      { _id: "a1", name: "A" },
      { _id: "b2", name: "B" },
    ];
    mockFetch.mockResolvedValue(records);

    const { fetchRecords, getCachedRecord, cacheSize } = useRecordCache();
    const result = await fetchRecords("my_table", ["a1", "b2"]);

    expect(result).toHaveLength(2);
    expect(cacheSize.value).toBe(2);
    expect(getCachedRecord("my_table", "a1")).toEqual(records[0]);
    expect(getCachedRecord("my_table", "b2")).toEqual(records[1]);
  });

  it("skips already-cached IDs in bulk fetch", async () => {
    const singleRecord = { _id: "a1", name: "A" };
    const bulkRecords = [{ _id: "b2", name: "B" }];

    mockFetch
      .mockResolvedValueOnce(singleRecord)
      .mockResolvedValueOnce(bulkRecords);

    const { fetchRecord, fetchRecords } = useRecordCache();

    // Cache a1 via single fetch
    await fetchRecord("my_table", "a1");

    // Bulk fetch [a1, b2] — only b2 should hit the API
    const result = await fetchRecords("my_table", ["a1", "b2"]);

    expect(result).toHaveLength(2);
    expect(mockFetch).toHaveBeenCalledTimes(2);
    // The bulk call should only request b2
    expect(mockFetch).toHaveBeenLastCalledWith("/api/my_table/records", {
      method: "POST",
      body: { ids: ["b2"] },
      headers: { "x-api-key": "test-key" },
    });
  });

  it("returns only cached records when all IDs are already cached", async () => {
    const records = [
      { _id: "a1", name: "A" },
      { _id: "b2", name: "B" },
    ];
    mockFetch.mockResolvedValueOnce(records);

    const { fetchRecords } = useRecordCache();

    await fetchRecords("my_table", ["a1", "b2"]);
    mockFetch.mockClear();

    // Second call should not hit the API
    const result = await fetchRecords("my_table", ["a1", "b2"]);

    expect(result).toHaveLength(2);
    expect(mockFetch).not.toHaveBeenCalled();
  });
});

describe("useRecordCache - invalidation", () => {
  it("invalidateRecord removes a single entry and forces refetch", async () => {
    const record = { _id: "abc", name: "Original" };
    const updated = { _id: "abc", name: "Updated" };

    mockFetch.mockResolvedValueOnce(record).mockResolvedValueOnce(updated);

    const { fetchRecord, invalidateRecord, cacheSize } = useRecordCache();

    await fetchRecord("my_table", "abc");
    expect(cacheSize.value).toBe(1);

    invalidateRecord("my_table", "abc");
    expect(cacheSize.value).toBe(0);

    const result = await fetchRecord("my_table", "abc");
    expect(result).toEqual(updated);
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it("getCachedRecord returns null for uncached records", () => {
    const { getCachedRecord } = useRecordCache();
    expect(getCachedRecord("my_table", "nonexistent")).toBeNull();
  });

  it("getCachedRecord returns cached record synchronously", async () => {
    const record = { _id: "abc", name: "Sync" };
    mockFetch.mockResolvedValue(record);

    const { fetchRecord, getCachedRecord } = useRecordCache();
    await fetchRecord("my_table", "abc");

    expect(getCachedRecord("my_table", "abc")).toEqual(record);
  });
});
