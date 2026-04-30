import {
  ALERTS_METADATA_PROJECTION,
  fetchData,
  fetchTableConfig,
  fetchTableSqlColumns,
} from "@/server/database/dbOperations";
import { prepareAlertsStatistics } from "@/server/dataProcessing/dataTransformers";
import { validatePermissions } from "@/utils/accessControls";
import {
  buildStatisticsMonthlyRows,
  filterAlertsStatisticsByDateRange,
  statisticsRowsToCsv,
} from "@/utils/alertsStatistics";

import type { H3Event } from "h3";
import type { AlertsMetadata, DataEntry } from "@/types";

const SUPPORTED_FORMATS = ["csv"] as const;
type ExportFormat = (typeof SUPPORTED_FORMATS)[number];
const ALERTS_MAIN_PROJECTION = [
  "_id",
  "month_detec",
  "year_detec",
  "day_detec",
  "date_end_t1",
  "data_source",
  "territory_name",
  "alert_type",
  "area_alert_ha",
];

/**
 * Keeps preferred projection columns that exist on the target table.
 * Falls back to all available columns when none of the preferred columns exist.
 *
 * @param {string[]} preferredColumns - Columns this route wants to project.
 * @param {string[]} availableColumns - Columns available on the target table.
 * @returns {string[]} Safe projection columns to send to fetchData.
 */
const resolveProjectedColumns = (
  preferredColumns: string[],
  availableColumns: string[],
): string[] => {
  const projectedColumns = preferredColumns.filter((columnName) =>
    availableColumns.includes(columnName),
  );

  if (projectedColumns.length > 0) {
    return projectedColumns;
  }

  return availableColumns;
};

export default defineEventHandler(async (event: H3Event) => {
  const { table } = event.context.params as { table: string };
  const query = getQuery(event);
  const format = (query.format as string)?.toLowerCase();

  if (!format || !SUPPORTED_FORMATS.includes(format as ExportFormat)) {
    throw createError({
      statusCode: 400,
      statusMessage: `Invalid or missing format. Supported formats: ${SUPPORTED_FORMATS.join(", ")}`,
    });
  }

  try {
    const tableConfig = await fetchTableConfig(table);
    const permission = tableConfig.ROUTE_LEVEL_PERMISSION ?? "member";
    await validatePermissions(event, permission);

    const availableMainColumns = await fetchTableSqlColumns(table);
    const alertsMainProjection = resolveProjectedColumns(
      ALERTS_MAIN_PROJECTION,
      availableMainColumns,
    );
    const availableMetadataColumns = await fetchTableSqlColumns(
      `${table}__metadata`,
    );
    const alertsMetadataProjection = ALERTS_METADATA_PROJECTION.filter(
      (columnName) => availableMetadataColumns.includes(columnName),
    );

    const { mainData, metadata } = (await fetchData(table, {
      mainColumns: alertsMainProjection,
      includeMetadata: alertsMetadataProjection.length > 0,
      metadataColumns: alertsMetadataProjection,
    })) as {
      mainData: DataEntry[];
      metadata: AlertsMetadata[] | null;
    };

    let alertsStatistics = prepareAlertsStatistics(mainData, metadata);
    const minDate = (query.minDate as string | undefined)?.trim();
    const maxDate = (query.maxDate as string | undefined)?.trim();
    if (minDate && maxDate) {
      alertsStatistics = filterAlertsStatisticsByDateRange(
        alertsStatistics,
        minDate,
        maxDate,
      );
    }

    const rows = buildStatisticsMonthlyRows(alertsStatistics);

    const csv = statisticsRowsToCsv(rows, {
      alertsTotal: alertsStatistics.alertsTotal,
      hectaresTotal: alertsStatistics.hectaresTotal,
    });
    setResponseHeader(event, "Content-Type", "text/csv; charset=utf-8");
    setResponseHeader(
      event,
      "Content-Disposition",
      `attachment; filename="${table}-statistics.csv"`,
    );
    return csv;
  } catch (error) {
    if (error instanceof Error && "statusCode" in error) {
      throw error;
    }
    console.error("Error exporting statistics:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Internal server error",
    });
  }
});
