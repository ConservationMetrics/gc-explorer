import { describe, expect, it } from "vitest";

import {
  assertConfiguredColumnsExist,
  getConfiguredColumns,
} from "@/server/utils/assertConfiguredColumns";
import { VIEW_CONFIG_MISSING_COLUMNS_ERROR } from "@/types";

describe("getConfiguredColumns", () => {
  it("keeps trimmed non-empty columns and skips unset values", () => {
    expect(
      getConfiguredColumns([
        { field: "COLOR_COLUMN", column: " status " },
        { field: "ICON_COLUMN", column: "" },
        { field: "FRONT_END_FILTER_COLUMN", column: "   " },
        { field: "TIMESTAMP_COLUMN" },
        { field: "MEDIA_COLUMN", column: null },
      ]),
    ).toEqual([{ field: "COLOR_COLUMN", column: "status" }]);
  });
});

describe("assertConfiguredColumnsExist", () => {
  const availableColumns = ["_id", "status", "photo"];

  it("does not throw when every configured column exists", () => {
    expect(() =>
      assertConfiguredColumnsExist("map_dataset", availableColumns, [
        { field: "COLOR_COLUMN", column: "status" },
      ]),
    ).not.toThrow();
  });

  it("does not throw when nothing is configured", () => {
    expect(() =>
      assertConfiguredColumnsExist("map_dataset", availableColumns, []),
    ).not.toThrow();
  });

  it("throws 422 with field, column, and table for one missing column", () => {
    try {
      assertConfiguredColumnsExist("map_dataset", availableColumns, [
        { field: "COLOR_COLUMN", column: "missing_color" },
      ]);
      expect.unreachable("should have thrown");
    } catch (error: unknown) {
      expect(error).toMatchObject({
        statusCode: 422,
        statusMessage:
          'View config refers to missing columns on table "map_dataset": COLOR_COLUMN (missing_color).',
        data: {
          errorCode: VIEW_CONFIG_MISSING_COLUMNS_ERROR,
          table: "map_dataset",
          missing: [{ field: "COLOR_COLUMN", column: "missing_color" }],
        },
      });
    }
  });

  it("reports every missing column in one 422", () => {
    try {
      assertConfiguredColumnsExist("map_dataset", availableColumns, [
        { field: "COLOR_COLUMN", column: "missing_color" },
        { field: "ICON_COLUMN", column: "status" },
        { field: "MEDIA_COLUMN", column: "missing_photo" },
      ]);
      expect.unreachable("should have thrown");
    } catch (error: unknown) {
      expect(error).toMatchObject({
        statusCode: 422,
        data: {
          errorCode: VIEW_CONFIG_MISSING_COLUMNS_ERROR,
          table: "map_dataset",
          missing: [
            { field: "COLOR_COLUMN", column: "missing_color" },
            { field: "MEDIA_COLUMN", column: "missing_photo" },
          ],
        },
      });
    }
  });
});
