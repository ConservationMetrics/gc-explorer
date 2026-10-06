import { describe, it, expect, vi, onTestFinished } from "vitest";
import { useRoute } from "#imports";
import {
  buildTableExportQueryParams,
  useTableExportDownload,
} from "@/composables/downloads/useTableExportDownload";

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

  it("includes view_type when provided so the server resolves the right view", () => {
    expect(
      buildTableExportQueryParams({
        format: "csv",
        exportPath: "export",
        viewType: "gallery",
      }),
    ).toEqual({
      format: "csv",
      view_type: "gallery",
    });
  });

  it("omits view_type when not provided", () => {
    expect(
      buildTableExportQueryParams({
        format: "csv",
        exportPath: "export",
      }),
    ).toEqual({ format: "csv" });
  });
});

vi.mock("@/utils/browserDownload", () => ({
  triggerBrowserDownload: vi.fn(),
}));

describe("secondary exports from existing Alerts views", () => {
  it.each(["csv", "geojson", "kml"] as const)(
    "sends the parent Alerts view when exporting a secondary row as %s",
    async (format) => {
      const originalRoute = useRoute();
      const fetchExport = vi.fn().mockResolvedValue(new Blob());
      vi.stubGlobal("$fetch", fetchExport);
      onTestFinished(() => {
        vi.unstubAllGlobals();
        vi.mocked(useRoute).mockReturnValue(originalRoute);
      });
      vi.mocked(useRoute).mockReturnValue({
        path: "/alerts/observations",
        params: { tablename: "observations" },
        query: {},
      });
      const { downloadTableExport } = useTableExportDownload();
      await downloadTableExport({
        format,
        exportTableName: "mapping",
        recordId: "1",
      });
      expect(fetchExport).toHaveBeenLastCalledWith("/api/mapping/export", {
        params: {
          format,
          recordId: "1",
          view_type: "alerts",
          primary_dataset: "observations",
        },
        responseType: "blob",
      });
      await downloadTableExport({ format, recordId: "1" });
      expect(fetchExport).toHaveBeenLastCalledWith("/api/observations/export", {
        params: { format, recordId: "1", view_type: "alerts" },
        responseType: "blob",
      });
    },
  );
});
