import { describe, expect, it } from "vitest";

import {
  buildStatisticsMonthlyRows,
  filterAlertsStatisticsByDateRange,
  statisticsRowsToCsv,
  statisticsRowsToFeatureCollection,
} from "@/utils/alertsStatistics";
import type { AlertsStatistics } from "@/types";

const baseStatistics: AlertsStatistics = {
  territory: "Test",
  typeOfAlerts: ["mining"],
  dataProviders: ["provider"],
  alertDetectionRange: "01-2024 to 04-2024",
  allDates: ["01-2024", "02-2024", "03-2024", "04-2024"],
  earliestAlertsDate: "01-2024",
  recentAlertsDate: "04-2024",
  recentAlertsNumber: 5,
  alertsTotal: 12,
  alertsPerMonth: {
    "01-2024": 2,
    "02-2024": 5,
    "03-2024": 7,
    "04-2024": 12,
  },
  hectaresTotal: "20.00",
  hectaresPerMonth: {
    "01-2024": 3,
    "02-2024": 6,
    "03-2024": 10,
    "04-2024": 20,
  },
  twelveMonthsBefore: "4-2023",
};

describe("alertsStatistics utils", () => {
  it("filters cumulative series into selected range", () => {
    const result = filterAlertsStatisticsByDateRange(
      baseStatistics,
      "202402",
      "202403",
    );

    expect(result.alertsTotal).toBe(5);
    expect(result.recentAlertsDate).toBe("03-2024");
    expect(result.recentAlertsNumber).toBe(2);
    expect(result.alertsPerMonth).toEqual({
      "02-2024": 3,
      "03-2024": 5,
    });
    expect(result.hectaresTotal).toBe("7.00");
    expect(result.hectaresPerMonth).toEqual({
      "02-2024": 3,
      "03-2024": 7,
    });
  });

  it("builds monthly and cumulative rows for export", () => {
    const rows = buildStatisticsMonthlyRows(baseStatistics);
    expect(rows).toHaveLength(4);
    expect(rows[0]).toEqual({
      period: "01-2024",
      alertsMonthly: 2,
      alertsCumulative: 2,
      hectaresMonthly: 3,
      hectaresCumulative: 3,
    });
    expect(rows[3]).toEqual({
      period: "04-2024",
      alertsMonthly: 5,
      alertsCumulative: 12,
      hectaresMonthly: 10,
      hectaresCumulative: 20,
    });
  });

  it("serializes statistics rows to CSV with summary", () => {
    const rows = buildStatisticsMonthlyRows(baseStatistics);
    const csv = statisticsRowsToCsv(rows, {
      alertsTotal: baseStatistics.alertsTotal,
      hectaresTotal: baseStatistics.hectaresTotal,
    });
    expect(csv).toContain(
      "row_type,period,alerts_monthly,alerts_cumulative,hectares_monthly,hectares_cumulative,alerts_total,hectares_total",
    );
    expect(csv).toContain("monthly,01-2024,2,2,3,3,,");
    expect(csv).toContain("summary,,,,,,12,20.00");
  });

  it("serializes statistics rows to GeoJSON-style feature collection", () => {
    const rows = buildStatisticsMonthlyRows(baseStatistics);
    const geojson = statisticsRowsToFeatureCollection(rows, {
      alertsTotal: baseStatistics.alertsTotal,
      hectaresTotal: baseStatistics.hectaresTotal,
    });
    expect(geojson.type).toBe("FeatureCollection");
    expect(geojson.features).toHaveLength(5);
    expect(geojson.features[0].properties?.rowType).toBe("monthly");
    expect(geojson.features[4].properties?.rowType).toBe("summary");
    expect(geojson.features[4].properties?.alertsTotal).toBe(12);
  });
});
