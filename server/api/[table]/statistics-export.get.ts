import { fetchConfig, fetchData } from "@/server/database/dbOperations";
import { prepareAlertsStatistics } from "@/server/dataProcessing/dataTransformers";
import { validatePermissions } from "@/utils/accessControls";
import {
  buildStatisticsMonthlyRows,
  filterAlertsStatisticsByDateRange,
  statisticsRowsToCsv,
  statisticsRowsToFeatureCollection,
} from "@/utils/alertsStatistics";
// @ts-expect-error - tokml does not have types
import tokml from "tokml";

import type { H3Event } from "h3";
import type { AlertsMetadata, DataEntry } from "@/types";

const SUPPORTED_FORMATS = ["csv", "geojson", "kml"] as const;
type ExportFormat = (typeof SUPPORTED_FORMATS)[number];

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
    const viewsConfig = await fetchConfig();
    const permission = viewsConfig[table]?.ROUTE_LEVEL_PERMISSION ?? "member";
    await validatePermissions(event, permission);

    const { mainData, metadata } = (await fetchData(table)) as {
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

    if (format === "csv") {
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
    }

    const geojson = statisticsRowsToFeatureCollection(rows, {
      alertsTotal: alertsStatistics.alertsTotal,
      hectaresTotal: alertsStatistics.hectaresTotal,
    });

    if (format === "geojson") {
      setResponseHeader(
        event,
        "Content-Type",
        "application/geo+json; charset=utf-8",
      );
      setResponseHeader(
        event,
        "Content-Disposition",
        `attachment; filename="${table}-statistics.geojson"`,
      );
      return geojson;
    }

    const kml = tokml(geojson);
    setResponseHeader(
      event,
      "Content-Type",
      "application/vnd.google-earth.kml+xml; charset=utf-8",
    );
    setResponseHeader(
      event,
      "Content-Disposition",
      `attachment; filename="${table}-statistics.kml"`,
    );
    return kml;
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
