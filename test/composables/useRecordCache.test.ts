import { describe, it, expect, vi, beforeEach } from "vitest";
import { ref, computed } from "vue";
import { useRecordCache } from "@/composables/useRecordCache";

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

describe("useRecordCache", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

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

  it("clears the cache", async () => {
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
