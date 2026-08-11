import { describe, expect, it } from "vitest";

import { useAppConfig } from "#imports";
import {
  SECONDARY_DATASET_VIEW_TYPES,
  supportsSecondaryDataset,
} from "@/types";
import { viewTypes } from "@/nuxt.config";

describe("view type capabilities", () => {
  it("exposes the nuxt.config viewTypes list via useAppConfig", () => {
    expect(viewTypes).toEqual(["alerts", "map", "gallery"]);
    expect(useAppConfig().viewTypes).toEqual(viewTypes);
  });

  it("allows secondary datasets for alerts and map only", () => {
    expect(SECONDARY_DATASET_VIEW_TYPES).toEqual(["alerts", "map"]);
    expect(supportsSecondaryDataset("alerts")).toBe(true);
    expect(supportsSecondaryDataset("map")).toBe(true);
    expect(supportsSecondaryDataset("gallery")).toBe(false);
    expect(supportsSecondaryDataset(undefined)).toBe(false);
  });
});
