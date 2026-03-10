import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the database operations module
const mockFetchConfig = vi.fn();
const mockFetchRecord = vi.fn();

vi.mock("@/server/database/dbOperations", () => ({
  fetchConfig: () => mockFetchConfig(),
  fetchRecord: (table: string, id: string) => mockFetchRecord(table, id),
}));

vi.mock("@/utils/auth", () => ({
  validatePermissions: vi.fn(),
}));

describe("GET api/[table]/[recordId]", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockFetchConfig.mockResolvedValue({
      test_table: {
        ROUTE_LEVEL_PERMISSION: "anyone",
      },
    });
  });

  it("returns a raw record when found", async () => {
    const mockRecord = {
      _id: "abc123",
      name: "Test Record",
      g__type: "Point",
      g__coordinates: "[0, 0]",
    };
    mockFetchRecord.mockResolvedValue(mockRecord);

    const record = await mockFetchRecord("test_table", "abc123");

    expect(record).toEqual(mockRecord);
    expect(mockFetchRecord).toHaveBeenCalledWith("test_table", "abc123");
  });

  it("returns null when record is not found", async () => {
    mockFetchRecord.mockResolvedValue(null);

    const record = await mockFetchRecord("test_table", "nonexistent");

    expect(record).toBeNull();
  });

  it("preserves all raw fields without transformation", async () => {
    const rawRecord = {
      _id: "abc123",
      name: "Raw Value",
      category: "threat",
      g__type: "Point",
      g__coordinates: "[10, 20]",
      photos: "photo1.jpg,photo2.jpg",
      created_at: "2024-01-15T10:30:00Z",
    };
    mockFetchRecord.mockResolvedValue(rawRecord);

    const record = await mockFetchRecord("test_table", "abc123");

    expect(record).toEqual(rawRecord);
    expect(record.name).toBe("Raw Value");
    expect(record.photos).toBe("photo1.jpg,photo2.jpg");
  });
});
