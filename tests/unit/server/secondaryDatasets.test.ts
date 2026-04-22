import { describe, expect, it } from "vitest";

import {
  getSecondaryDatasets,
  normalizeSecondaryDatasets,
} from "@/server/utils/dbHelpers";

describe("getSecondaryDatasets", () => {
  it("returns empty array for non-string inputs", () => {
    expect(getSecondaryDatasets(undefined)).toEqual([]);
    expect(getSecondaryDatasets(null)).toEqual([]);
    expect(getSecondaryDatasets(123)).toEqual([]);
  });

  it("parses, trims and removes blanks", () => {
    expect(getSecondaryDatasets("  foo, bar ,, baz  ", 10)).toEqual([
      "foo",
      "bar",
      "baz",
    ]);
  });

  it("deduplicates while preserving first-seen order", () => {
    expect(getSecondaryDatasets("foo,bar,foo,baz,bar", 10)).toEqual([
      "foo",
      "bar",
      "baz",
    ]);
  });

  it("enforces max datasets", () => {
    expect(getSecondaryDatasets("a,b,c,d", 2)).toEqual(["a", "b"]);
  });

  it("returns empty array when max is 0 or less", () => {
    expect(getSecondaryDatasets("a,b", 0)).toEqual([]);
    expect(getSecondaryDatasets("a,b", -1)).toEqual([]);
  });
});

describe("normalizeSecondaryDatasets", () => {
  it("serializes normalized datasets as comma-separated string", () => {
    expect(normalizeSecondaryDatasets("a,b,a,c", 2)).toBe("a,b");
  });

  it("returns null when no valid secondary datasets", () => {
    expect(normalizeSecondaryDatasets(" , ", 2)).toBeNull();
    expect(normalizeSecondaryDatasets(undefined, 2)).toBeNull();
  });
});
