import { describe, it, expect, vi, beforeEach } from "vitest";

const mockFetchConfig = vi.fn();
const mockFetchRecords = vi.fn();

vi.mock("@/server/database/dbOperations", () => ({
  fetchConfig: () => mockFetchConfig(),
  fetchRecords: (table: string, ids: string[]) => mockFetchRecords(table, ids),
}));

vi.mock("@/utils/accessControls", () => ({
  validatePermissions: vi.fn(),
}));

describe("POST api/[table]/records", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockFetchConfig.mockResolvedValue({
      test_table: {
        ROUTE_LEVEL_PERMISSION: "anyone",
      },
    });
  });

  it("returns raw records for the requested IDs", async () => {
    const mockRecords = [
      { _id: "a1", name: "Record A", g__type: "Point" },
      { _id: "b2", name: "Record B", g__type: "Point" },
    ];
    mockFetchRecords.mockResolvedValue(mockRecords);

    const records = await mockFetchRecords("test_table", ["a1", "b2"]);

    expect(records).toEqual(mockRecords);
    expect(records).toHaveLength(2);
    expect(mockFetchRecords).toHaveBeenCalledWith("test_table", ["a1", "b2"]);
  });

  it("preserves request order in response", async () => {
    const mockRecords = [
      { _id: "b2", name: "Record B" },
      { _id: "a1", name: "Record A" },
    ];
    mockFetchRecords.mockResolvedValue(mockRecords);

    const records = await mockFetchRecords("test_table", ["b2", "a1"]);

    expect(records[0]._id).toBe("b2");
    expect(records[1]._id).toBe("a1");
  });

  it("returns empty array when no records match", async () => {
    mockFetchRecords.mockResolvedValue([]);

    const records = await mockFetchRecords("test_table", ["nonexistent"]);

    expect(records).toEqual([]);
    expect(records).toHaveLength(0);
  });

  it("omits IDs that are not found", async () => {
    const mockRecords = [{ _id: "a1", name: "Record A" }];
    mockFetchRecords.mockResolvedValue(mockRecords);

    const records = await mockFetchRecords("test_table", [
      "a1",
      "missing",
      "gone",
    ]);

    expect(records).toHaveLength(1);
    expect(records[0]._id).toBe("a1");
  });

  it("returns raw untransformed fields", async () => {
    const rawRecords = [
      {
        _id: "abc",
        p__categoryid: "threat",
        g__type: "Point",
        g__coordinates: "[10, 20]",
        p__photos: "photo1.jpg",
        created_at: "2024-01-15T10:30:00Z",
      },
    ];
    mockFetchRecords.mockResolvedValue(rawRecords);

    const records = await mockFetchRecords("test_table", ["abc"]);

    expect(records[0].p__categoryid).toBe("threat");
    expect(records[0].g__type).toBe("Point");
    expect(records[0].p__photos).toBe("photo1.jpg");
  });

  it("throws when table does not exist", async () => {
    mockFetchRecords.mockRejectedValue(new Error("Table does not exist"));

    await expect(mockFetchRecords("nonexistent_table", ["a1"])).rejects.toThrow(
      "Table does not exist",
    );
  });
});
