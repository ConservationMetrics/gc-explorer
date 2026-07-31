import { describe, it, expect, vi } from "vitest";

import {
  formatDate,
  formatDateOnly,
  formatLocaleDate,
  formatPlanetMonth,
  getPlanetMaxMonth,
  parseDateMs,
} from "@/utils/dateUtils";

describe("parseDateMs", () => {
  it("parses numeric timestamps and date strings", () => {
    expect(parseDateMs(1704067200000)).toBe(1704067200000);
    expect(parseDateMs("2024-01-01T00:00:00.000Z")).toBe(1704067200000);
  });

  it("returns null for empty or invalid values", () => {
    expect(parseDateMs(null)).toBeNull();
    expect(parseDateMs("")).toBeNull();
    expect(parseDateMs("not-a-date")).toBeNull();
  });
});

describe("formatLocaleDate", () => {
  it("should format a date string to a locale date string", () => {
    expect(formatLocaleDate(1, 2024)).toBe("01-2024");
    expect(formatLocaleDate(1, 2024, 1)).toBe("01-01-2024");
  });
});

describe("formatDateOnly", () => {
  it("formats ISO datetimes to yyyy-MM-dd using the UTC calendar day", () => {
    expect(formatDateOnly("2026-07-23T07:42:48.795Z")).toBe("2026-07-23");
    expect(formatDateOnly("2026-07-29T03:45:32.260Z")).toBe("2026-07-29");
  });

  it("leaves plain dates and non-ISO values unchanged", () => {
    expect(formatDateOnly("2025-01-10")).toBe("2025-01-10");
    expect(formatDateOnly("3/9/2024")).toBe("3/9/2024");
    expect(formatDateOnly("not-a-timestamp")).toBe("not-a-timestamp");
  });
});

describe("formatDate", () => {
  it("returns the input unchanged when the string does not match the ISO pattern", () => {
    expect(formatDate("not-a-timestamp")).toBe("not-a-timestamp");
  });

  it("formats matching ISO timestamps via toLocaleDateString", () => {
    const spy = vi
      .spyOn(Date.prototype, "toLocaleDateString")
      .mockReturnValue("1/15/2024");
    expect(formatDate("2024-01-15T12:30:45.000Z")).toBe("1/15/2024");
    spy.mockRestore();
  });
});

describe("Planet monthly basemap dates", () => {
  it("formats dates as Planet month identifiers", () => {
    expect(formatPlanetMonth(new Date(2024, 0, 1))).toBe("2024_01");
  });

  it("uses two months ago through the 15th", () => {
    expect(getPlanetMaxMonth(new Date(2024, 0, 15, 12))).toBe("2023_11");
  });

  it("uses the previous month after the 15th", () => {
    expect(getPlanetMaxMonth(new Date(2024, 0, 16, 12))).toBe("2023_12");
  });
});
