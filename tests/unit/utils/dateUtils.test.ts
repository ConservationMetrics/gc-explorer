import { describe, it, expect } from "vitest";

import { formatLocaleDate } from "@/utils/dateUtils";

describe("formatLocaleDate", () => {
  it("should format a date string to a locale date string", () => {
    expect(formatLocaleDate(1, 2024)).toBe("01-2024");
    expect(formatLocaleDate(1, 2024, 1)).toBe("01-01-2024");
  });
});
