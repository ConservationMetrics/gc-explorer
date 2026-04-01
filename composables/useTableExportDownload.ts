import { useI18n, useRoute, useToast } from "#imports";
import { triggerBrowserDownload } from "@/utils/browserDownload";

export type TableExportFormat = "csv" | "geojson" | "kml";

/**
 * Builds query parameters for GET `/api/:table/:exportPath` requests.
 *
 * @param options - Export filters and date range options.
 * @param options.format - File format requested from the server.
 * @param options.exportPath - Path segment after the table name (for example `export` or `statistics-export`).
 * @param options.exportFilterColumn - Optional column to filter by when exporting spatial data.
 * @param options.exportFilterValues - Values for `exportFilterColumn`.
 * @param options.exportMinDate - Start of date range (when applicable).
 * @param options.exportMaxDate - End of date range (when applicable).
 * @param options.exportTimestampColumn - When set for spatial export, date range params are applied.
 * @returns {Record<string, string>} Query string parameters for the request.
 */
export const buildTableExportQueryParams = (options: {
  format: TableExportFormat;
  exportPath: string;
  exportFilterColumn?: string;
  exportFilterValues?: string[];
  exportMinDate?: string;
  exportMaxDate?: string;
  exportTimestampColumn?: string;
}): Record<string, string> => {
  const params: Record<string, string> = { format: options.format };
  if (options.exportFilterColumn && options.exportFilterValues?.length) {
    params.filterColumn = options.exportFilterColumn;
    params.filterValues = options.exportFilterValues.join(",");
  }
  const isStatisticsExport = options.exportPath === "statistics-export";
  if (
    (options.exportTimestampColumn || isStatisticsExport) &&
    (options.exportMinDate || options.exportMaxDate)
  ) {
    if (options.exportMinDate) params.minDate = options.exportMinDate;
    if (options.exportMaxDate) params.maxDate = options.exportMaxDate;
  }
  return params;
};

/**
 * Composable for downloading export blobs from table API routes and saving them in the browser.
 *
 * @returns {object} An object containing `downloadTableExport` and `getTablename` functions.
 */
export function useTableExportDownload() {
  const route = useRoute();
  const { t } = useI18n();
  const { warning: showWarningToast } = useToast();

  /**
   * Resolves the current route `tablename` param, or `"data"` when missing.
   *
   * @returns {string} Table segment used in `/api/:table/...` URLs.
   */
  const getTablename = (): string => {
    const tablename = route.params.tablename;
    return typeof tablename === "string" ? tablename : "data";
  };

  /**
   * Requests an export from the server; the server formats the response (CSV, GeoJSON, or KML).
   * The client stores the returned blob as a download.
   *
   * @param options - Export request options.
   * @param options.exportPath - API segment after the table name; defaults to `"export"`.
   * @param options.format - One of `"csv"`, `"geojson"`, or `"kml"`.
   * @param options.exportFilterColumn - Optional filter column for spatial exports.
   * @param options.exportFilterValues - Values for the filter column.
   * @param options.exportMinDate - Optional statistics or timestamp range start.
   * @param options.exportMaxDate - Optional statistics or timestamp range end.
   * @param options.exportTimestampColumn - When set, date range applies to spatial export.
   * @param options.filenamePrefix - Download basename without extension; defaults to the table name.
   * @returns {Promise<void>}
   */
  const downloadTableExport = async (options: {
    exportPath?: string;
    format: TableExportFormat;
    exportFilterColumn?: string;
    exportFilterValues?: string[];
    exportMinDate?: string;
    exportMaxDate?: string;
    exportTimestampColumn?: string;
    filenamePrefix?: string;
  }): Promise<void> => {
    const exportPath = options.exportPath ?? "export";
    const tablename = getTablename();
    if (tablename === "data") {
      console.error("No table name available for export.");
      showWarningToast(t("errorNoDataToDownload"));
      return;
    }

    try {
      const params = buildTableExportQueryParams({
        format: options.format,
        exportPath,
        exportFilterColumn: options.exportFilterColumn,
        exportFilterValues: options.exportFilterValues,
        exportMinDate: options.exportMinDate,
        exportMaxDate: options.exportMaxDate,
        exportTimestampColumn: options.exportTimestampColumn,
      });
      const blob = await $fetch<Blob>(`/api/${tablename}/${exportPath}`, {
        params,
        responseType: "blob",
      });
      const filenameBase = options.filenamePrefix ?? tablename;
      triggerBrowserDownload(blob, `${filenameBase}.${options.format}`);
    } catch (error) {
      console.error(`Failed to export ${options.format}:`, error);
      showWarningToast(t("errorNoDataToDownload"));
    }
  };

  return { downloadTableExport, getTablename };
}
