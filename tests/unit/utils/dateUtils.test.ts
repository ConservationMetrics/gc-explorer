import { describe, it, expect, vi } from "vitest";

import { formatDate, formatLocaleDate } from "@/utils/dateUtils";

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
