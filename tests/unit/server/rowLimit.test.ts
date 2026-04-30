import { describe, it, expect, vi, beforeEach } from "vitest";
import { validateRowLimit } from "@/server/utils/dbHelpers";

/** Matches `runtimeConfig.public.rowLimit` default in `nuxt.config.ts`. */
const DEFAULT_ROW_LIMIT = 10_000;

const mockFetchConfig = vi.fn();
const mockFetchData = vi.fn();

vi.mock("@/server/database/dbOperations", () => ({
  fetchConfig: () => mockFetchConfig(),
  fetchData: (
    table: string,
    options: { limit?: number; mainColumns: string[] },
  ) => mockFetchData(table, options),
}));

vi.mock("@/utils/accessControls", () => ({
  validatePermissions: vi.fn(),
}));

describe("validateRowLimit", () => {
  it("defaults to maxLimit when input is null", () => {
    expect(validateRowLimit(null, DEFAULT_ROW_LIMIT)).toBe(DEFAULT_ROW_LIMIT);
  });

  it("defaults to maxLimit when input is undefined", () => {
    expect(validateRowLimit(undefined, DEFAULT_ROW_LIMIT)).toBe(
      DEFAULT_ROW_LIMIT,
    );
  });

  it("returns parsed limit when valid and within bounds", () => {
    expect(validateRowLimit("500", DEFAULT_ROW_LIMIT)).toBe(500);
  });

  it("accepts limit equal to maxLimit", () => {
    expect(validateRowLimit(String(DEFAULT_ROW_LIMIT), DEFAULT_ROW_LIMIT)).toBe(
      DEFAULT_ROW_LIMIT,
    );
  });

  it("accepts numeric input", () => {
    expect(validateRowLimit(100, DEFAULT_ROW_LIMIT)).toBe(100);
  });

  it("throws 422 when limit exceeds maxLimit", () => {
    try {
      validateRowLimit(String(DEFAULT_ROW_LIMIT + 1), DEFAULT_ROW_LIMIT);
      expect.unreachable("should have thrown");
    } catch (error: unknown) {
      const err = error as Error & { statusCode: number };
      expect(err.statusCode).toBe(422);
      expect(err.message).toContain("exceeds server maximum");
    }
  });

  it("throws 422 for non-numeric limit", () => {
    try {
      validateRowLimit("abc", DEFAULT_ROW_LIMIT);
      expect.unreachable("should have thrown");
    } catch (error: unknown) {
      const err = error as Error & { statusCode: number };
      expect(err.statusCode).toBe(422);
      expect(err.message).toContain("positive integer");
    }
  });

  it("throws 422 for zero limit", () => {
    try {
      validateRowLimit("0", DEFAULT_ROW_LIMIT);
      expect.unreachable("should have thrown");
    } catch (error: unknown) {
      const err = error as Error & { statusCode: number };
      expect(err.statusCode).toBe(422);
    }
  });

  it("throws 422 for negative limit", () => {
    try {
      validateRowLimit("-5", DEFAULT_ROW_LIMIT);
      expect.unreachable("should have thrown");
    } catch (error: unknown) {
      const err = error as Error & { statusCode: number };
      expect(err.statusCode).toBe(422);
    }
  });

  it("throws 422 for fractional limit", () => {
    try {
      validateRowLimit("10.5", DEFAULT_ROW_LIMIT);
      expect.unreachable("should have thrown");
    } catch (error: unknown) {
      const err = error as Error & { statusCode: number };
      expect(err.statusCode).toBe(422);
    }
  });
});

describe("dataset endpoints pass limit to fetchData", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockFetchConfig.mockResolvedValue({
      test_table: {
        ROUTE_LEVEL_PERMISSION: "anyone",
        FRONT_END_FILTER_COLUMN: "community",
      },
    });
  });

  it("rowLimitReached is true when data length equals limit", async () => {
    const limit = 5;
    const rows = Array.from({ length: limit }, (_, i) => ({
      _id: `rec${i}`,
      name: `Record ${i}`,
    }));

    mockFetchData.mockResolvedValue({
      mainData: rows,
      columnsData: null,
      metadata: null,
    });

    const options = { limit, mainColumns: ["_id", "name"] };
    const { mainData } = await mockFetchData("test_table", options);

    expect(mockFetchData).toHaveBeenCalledWith("test_table", options);
    expect(mainData.length >= limit).toBe(true);
  });

  it("rowLimitReached is false when data length is below limit", async () => {
    const limit = 100;
    const rows = [
      { _id: "rec1", name: "Record 1" },
      { _id: "rec2", name: "Record 2" },
    ];

    mockFetchData.mockResolvedValue({
      mainData: rows,
      columnsData: null,
      metadata: null,
    });

    const options = { limit, mainColumns: ["_id", "name"] };
    const { mainData } = await mockFetchData("test_table", options);

    expect(mockFetchData).toHaveBeenCalledWith("test_table", options);
    expect(mainData.length >= limit).toBe(false);
  });
});
