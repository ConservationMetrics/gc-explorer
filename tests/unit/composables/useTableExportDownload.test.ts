import { describe, it, expect } from "vitest";
import { buildTableExportQueryParams } from "@/composables/useTableExportDownload";

describe("buildTableExportQueryParams", () => {
  it("includes filter params for spatial export", () => {
    expect(
      buildTableExportQueryParams({
        format: "csv",
        exportPath: "export",
        exportFilterColumn: "category",
        exportFilterValues: ["a", "b"],
      }),
    ).toEqual({
      format: "csv",
      filterColumn: "category",
      filterValues: "a,b",
    });
  });

  it("adds min/max dates for statistics-export when dates are present", () => {
    expect(
      buildTableExportQueryParams({
        format: "csv",
        exportPath: "statistics-export",
        exportMinDate: "202401",
        exportMaxDate: "202403",
      }),
    ).toEqual({
      format: "csv",
      minDate: "202401",
      maxDate: "202403",
    });
  });

  it("adds min/max dates for spatial export when timestamp column is set", () => {
    expect(
      buildTableExportQueryParams({
        format: "geojson",
        exportPath: "export",
        exportTimestampColumn: "observed_at",
        exportMinDate: "202401",
        exportMaxDate: "202403",
      }),
    ).toEqual({
      format: "geojson",
      minDate: "202401",
      maxDate: "202403",
    });
  });

  it("includes recordId when provided for single-row export", () => {
    expect(
      buildTableExportQueryParams({
        format: "csv",
        exportPath: "export",
        recordId: "  rec-abc  ",
      }),
    ).toEqual({
      format: "csv",
      recordId: "rec-abc",
    });
  });
});
