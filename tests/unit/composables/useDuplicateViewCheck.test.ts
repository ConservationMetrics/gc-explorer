import { describe, expect, it } from "vitest";

import { findDuplicateView } from "@/composables/useDuplicateViewCheck";
import type { ViewConfigRow } from "@/types";

const row = (
  viewType: ViewConfigRow["viewType"],
  primaryDataset: string,
): ViewConfigRow => ({
  viewId: 1,
  viewName: primaryDataset,
  viewType,
  primaryDataset,
  secondaryDataset: null,
  viewConfig: {},
});

describe("findDuplicateView", () => {
  it("returns the matching view type for a primary dataset", () => {
    const rows = [
      row("map", "seed_survey_data"),
      row("gallery", "seed_survey_data"),
    ];

    expect(findDuplicateView(rows, "gallery")?.viewType).toBe("gallery");
    expect(findDuplicateView(rows, "alerts")).toBeUndefined();
  });

  it("returns undefined when there are no rows", () => {
    expect(findDuplicateView([], "map")).toBeUndefined();
  });
});
