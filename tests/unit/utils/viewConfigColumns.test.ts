import { describe, expect, it } from "vitest";

import {
  getSelectableColumnOptions,
  validateViewConfigColumns,
} from "@/utils/viewConfigColumns";

import type { ColumnEntry } from "@/types";

const primaryColumns: ColumnEntry[] = [
  { original_column: "_id", sql_column: "_id" },
  { original_column: "geometry type", sql_column: "g__type" },
  { original_column: "geometry", sql_column: "g__coordinates" },
  { original_column: "Status", sql_column: "status" },
  { original_column: "Photo", sql_column: "photo" },
  { original_column: "Recorded at", sql_column: "recorded_at" },
];

const secondaryColumns: ColumnEntry[] = [
  { original_column: "_id", sql_column: "_id" },
  { original_column: "Category", sql_column: "p__categoryid" },
];

describe("viewConfigColumns", () => {
  it("removes _id from functional column choices", () => {
    expect(
      getSelectableColumnOptions(primaryColumns).map(
        (column) => column.sql_column,
      ),
    ).toEqual(["g__type", "g__coordinates", "status", "photo", "recorded_at"]);
  });

  it("rejects protected, missing, and unavailable columns", () => {
    const validation = validateViewConfigColumns(
      {
        COLOR_COLUMN: "not_a_column",
        ICON_COLUMN: "_id",
      },
      primaryColumns,
      [],
      "gallery",
      false,
    );

    expect(validation.invalidSelections).toEqual({
      COLOR_COLUMN: "not_a_column",
      ICON_COLUMN: "_id",
    });
    expect(validation.isValid).toBe(false);
  });

  it("uses secondary columns for the Alerts filter column", () => {
    const validation = validateViewConfigColumns(
      {
        FRONT_END_FILTER_COLUMN: "p__categoryid",
      },
      primaryColumns,
      secondaryColumns,
      "alerts",
      true,
    );

    expect(validation.isValid).toBe(true);
  });
});
