import { describe, it, expect, vi } from "vitest";

import {
  formatDate,
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
