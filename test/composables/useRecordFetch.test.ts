import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  getRecord,
  getRecords,
  invalidate,
  clear,
  useRecordFetch,
} from "@/composables/useRecordFetch";

const mockFetch = vi.fn();

beforeEach(() => {
  vi.stubGlobal("$fetch", mockFetch);
  vi.stubGlobal("useRuntimeConfig", () => ({
    public: { appApiKey: "test-key" },
  }));
  mockFetch.mockReset();
  clear();
});

describe("useRecordFetch", () => {
  describe("getRecord", () => {
    it("returns cached data without issuing a network request on second call", async () => {
      const record = { _id: "r1", name: "First" };
      mockFetch.mockResolvedValue(record);

      const first = await getRecord("t1", "r1");
      const second = await getRecord("t1", "r1");

      expect(first).toEqual(record);
      expect(second).toEqual(record);
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it("de-duplicates concurrent requests for the same table and id", async () => {
      const record = { _id: "r1", name: "First" };
      mockFetch.mockImplementation(
        () =>
          new Promise((resolve) => setTimeout(() => resolve(record), 20)),
      );

      const [a, b, c] = await Promise.all([
        getRecord("t1", "r1"),
        getRecord("t1", "r1"),
        getRecord("t1", "r1"),
      ]);

      expect(a).toEqual(record);
      expect(b).toEqual(record);
      expect(c).toEqual(record);
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it("calls GET api/[table]/[recordId] with encoded params", async () => {
      mockFetch.mockResolvedValue({ _id: "id-1" });
      await getRecord("my_table", "id-1");
      expect(mockFetch).toHaveBeenCalledWith(
        "/api/my_table/id-1",
        expect.objectContaining({ headers: { "x-api-key": "test-key" } }),
      );
    });

    it("after invalidate(table, id), next getRecord refetches", async () => {
      const record = { _id: "r1", name: "First" };
      mockFetch.mockResolvedValue(record);

      await getRecord("t1", "r1");
      expect(mockFetch).toHaveBeenCalledTimes(1);

      invalidate("t1", "r1");
      await getRecord("t1", "r1");
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it("after invalidate(table), next getRecord for that table refetches", async () => {
      mockFetch.mockResolvedValue({ _id: "r1" });
      await getRecord("t1", "r1");
      mockFetch.mockResolvedValue({ _id: "r2" });
      await getRecord("t1", "r2");
      expect(mockFetch).toHaveBeenCalledTimes(2);

      invalidate("t1");
      mockFetch.mockResolvedValue({ _id: "r1" });
      await getRecord("t1", "r1");
      mockFetch.mockResolvedValue({ _id: "r2" });
      await getRecord("t1", "r2");
      expect(mockFetch).toHaveBeenCalledTimes(4);
    });

    it("exposes getRecord via useRecordFetch()", () => {
      const { getRecord: getRecordFromComposable } = useRecordFetch();
      expect(getRecordFromComposable).toBe(getRecord);
    });
  });

  describe("getRecords", () => {
    it("calls POST api/[table]/records and returns records in request order", async () => {
      const records = [
        { _id: "a", name: "A" },
        { _id: "b", name: "B" },
      ];
      mockFetch.mockResolvedValue({ records });

      const result = await getRecords("t1", ["a", "b"]);

      expect(result).toEqual(records);
      expect(mockFetch).toHaveBeenCalledWith(
        "/api/t1/records",
        expect.objectContaining({
          method: "POST",
          body: { ids: ["a", "b"] },
          headers: { "x-api-key": "test-key" },
        }),
      );
    });

    it("populates cache so getRecord returns without network", async () => {
      const records = [{ _id: "r1", name: "R1" }];
      mockFetch.mockResolvedValue({ records });

      await getRecords("t1", ["r1"]);
      expect(mockFetch).toHaveBeenCalledTimes(1);

      const single = await getRecord("t1", "r1");
      expect(single).toEqual(records[0]);
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });
  });

  describe("clear", () => {
    it("clears cache so next getRecord refetches", async () => {
      mockFetch.mockResolvedValue({ _id: "r1" });
      await getRecord("t1", "r1");
      clear();
      mockFetch.mockResolvedValue({ _id: "r1" });
      await getRecord("t1", "r1");
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });
  });
});
