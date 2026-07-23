import { describe, expect, it } from "vitest";

import {
  SECONDARY_DATASET_VIEW_TYPES,
  supportsSecondaryDataset,
  VIEW_TYPES,
} from "@/utils/viewTypes";

describe("view type capabilities", () => {
  it("declares every supported view type", () => {
    expect(VIEW_TYPES).toEqual(["alerts", "map", "gallery"]);
  });

  it("allows secondary datasets for alerts and map only", () => {
    expect(SECONDARY_DATASET_VIEW_TYPES).toEqual(["alerts", "map"]);
    expect(supportsSecondaryDataset("alerts")).toBe(true);
    expect(supportsSecondaryDataset("map")).toBe(true);
    expect(supportsSecondaryDataset("gallery")).toBe(false);
    expect(supportsSecondaryDataset(undefined)).toBe(false);
  });
});
