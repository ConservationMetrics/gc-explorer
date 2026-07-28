import { describe, expect, it } from "vitest";

import { matchesSearchQuery, matchesViewTypeFilter } from "@/utils/viewFilters";

describe("matchesSearchQuery", () => {
  it("matches when the query is empty", () => {
    expect(matchesSearchQuery("", "Biodiversity Gallery")).toBe(true);
    expect(matchesSearchQuery("   ", "Biodiversity Gallery")).toBe(true);
  });

  it("matches viewName or primaryDataset case-insensitively", () => {
    expect(
      matchesSearchQuery("bio", "Biodiversity Gallery", "bcmform_responses"),
    ).toBe(true);
    expect(
      matchesSearchQuery(
        "BCMFORM",
        "Biodiversity Gallery",
        "bcmform_responses",
      ),
    ).toBe(true);
    expect(
      matchesSearchQuery("xyz", "Biodiversity Gallery", "bcmform_responses"),
    ).toBe(false);
  });

  it("treats nullish fields as empty strings", () => {
    expect(matchesSearchQuery("gallery", null, undefined, "Gallery")).toBe(
      true,
    );
    expect(matchesSearchQuery("gallery", null, undefined)).toBe(false);
  });
});

describe("matchesViewTypeFilter", () => {
  it("includes every item when the filter is all", () => {
    expect(matchesViewTypeFilter("all", "map")).toBe(true);
    expect(matchesViewTypeFilter("all", ["gallery", "alerts"])).toBe(true);
  });

  it("matches a single view type", () => {
    expect(matchesViewTypeFilter("gallery", "gallery")).toBe(true);
    expect(matchesViewTypeFilter("gallery", "map")).toBe(false);
  });

  it("matches when any listed view type equals the filter", () => {
    expect(matchesViewTypeFilter("map", ["gallery", "map"])).toBe(true);
    expect(matchesViewTypeFilter("alerts", ["gallery", "map"])).toBe(false);
  });
});
