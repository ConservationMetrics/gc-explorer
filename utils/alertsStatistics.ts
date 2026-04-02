import type { AlertsPerMonth, AlertsStatistics } from "@/types";
import type { Feature, FeatureCollection } from "geojson";
import { escapeCSVValue } from "@/utils/csvUtils";
import { camelToSnake } from "@/utils/identifierUtils";

type MonthlySeriesRow = {
  period: string;
  alertsMonthly: number;
  alertsCumulative: number;
  hectaresMonthly: number | null;
  hectaresCumulative: number | null;
};

type StatisticsSummary = {
  alertsTotal: number;
  hectaresTotal: string | null;
};

const monthKeyToSortable = (monthKey: string): number => {
  const [month, year] = monthKey.split("-").map(Number);
  if (!month || !year) return 0;
  return year * 100 + month;
};

const sortableToMonthKey = (sortable: number): string => {
  const year = Math.floor(sortable / 100);
  const month = sortable % 100;
  return `${String(month).padStart(2, "0")}-${year}`;
};

const sortMonthKeys = (monthKeys: string[]): string[] => {
  return [...monthKeys].sort(
    (left, right) => monthKeyToSortable(left) - monthKeyToSortable(right),
  );
};

const cumulativeToMonthly = (series: AlertsPerMonth): AlertsPerMonth => {
  const orderedKeys = sortMonthKeys(Object.keys(series));
  const monthly: AlertsPerMonth = {};
  let previous = 0;

  orderedKeys.forEach((key) => {
    const current = Number(series[key] ?? 0);
    monthly[key] = Number((current - previous).toFixed(2));
    previous = current;
  });

  return monthly;
};

const buildCumulativeSeries = (series: AlertsPerMonth): AlertsPerMonth => {
  const orderedKeys = sortMonthKeys(Object.keys(series));
  const cumulative: AlertsPerMonth = {};
  let runningTotal = 0;

  orderedKeys.forEach((key) => {
    runningTotal += Number(series[key] ?? 0);
    cumulative[key] = Number(runningTotal.toFixed(2));
  });

  return cumulative;
};

const filterMonthsInRange = (
  monthKeys: string[],
  startYYYYMM: string,
  endYYYYMM: string,
): string[] => {
  const min = Number(startYYYYMM);
  const max = Number(endYYYYMM);
  return sortMonthKeys(monthKeys).filter((monthKey) => {
    const sortable = monthKeyToSortable(monthKey);
    return sortable >= min && sortable <= max;
  });
};

/**
 * Filters alerts statistics to a YYYYMM date range while preserving
 * the same cumulative chart shape used by the dashboard components.
 *
 * @param {AlertsStatistics} alertsStatistics - Full statistics payload.
 * @param {string} startYYYYMM - Inclusive start period in YYYYMM.
 * @param {string} endYYYYMM - Inclusive end period in YYYYMM.
 * @returns {AlertsStatistics} Filtered statistics payload for the selected range.
 */
export const filterAlertsStatisticsByDateRange = (
  alertsStatistics: AlertsStatistics,
  startYYYYMM: string,
  endYYYYMM: string,
): AlertsStatistics => {
  const inRangeMonths = filterMonthsInRange(
    Object.keys(alertsStatistics.alertsPerMonth),
    startYYYYMM,
    endYYYYMM,
  );

  if (inRangeMonths.length === 0) {
    return {
      ...alertsStatistics,
      allDates: [],
      recentAlertsDate: "N/A",
      recentAlertsNumber: 0,
      alertsTotal: 0,
      alertsPerMonth: {},
      hectaresTotal: alertsStatistics.hectaresTotal === null ? null : "0.00",
      hectaresPerMonth: alertsStatistics.hectaresPerMonth ? {} : null,
    };
  }

  const allDates = filterMonthsInRange(
    alertsStatistics.allDates,
    startYYYYMM,
    endYYYYMM,
  );

  const alertsMonthly = cumulativeToMonthly(alertsStatistics.alertsPerMonth);
  const filteredAlertsMonthly: AlertsPerMonth = {};
  inRangeMonths.forEach((monthKey) => {
    filteredAlertsMonthly[monthKey] = alertsMonthly[monthKey] ?? 0;
  });
  const filteredAlertsPerMonth = buildCumulativeSeries(filteredAlertsMonthly);
  const alertsTotal = Number(
    Object.values(filteredAlertsMonthly)
      .reduce((sum, value) => sum + Number(value), 0)
      .toFixed(2),
  );

  const latestMonthInRange = inRangeMonths[inRangeMonths.length - 1];
  const recentAlertsNumber = Number(
    (filteredAlertsMonthly[latestMonthInRange] ?? 0).toFixed(2),
  );

  const filteredHectaresMonthly: AlertsPerMonth = {};
  let filteredHectaresPerMonth: AlertsPerMonth | null = null;
  let hectaresTotal: string | null = null;

  if (alertsStatistics.hectaresPerMonth) {
    const hectaresMonthly = cumulativeToMonthly(
      alertsStatistics.hectaresPerMonth,
    );
    inRangeMonths.forEach((monthKey) => {
      filteredHectaresMonthly[monthKey] = hectaresMonthly[monthKey] ?? 0;
    });
    filteredHectaresPerMonth = buildCumulativeSeries(filteredHectaresMonthly);
    hectaresTotal = Object.values(filteredHectaresMonthly)
      .reduce((sum, value) => sum + Number(value), 0)
      .toFixed(2);
  }

  return {
    ...alertsStatistics,
    alertDetectionRange: `${sortableToMonthKey(Number(startYYYYMM))} to ${sortableToMonthKey(Number(endYYYYMM))}`,
    allDates,
    recentAlertsDate: latestMonthInRange ?? "N/A",
    recentAlertsNumber,
    alertsTotal,
    alertsPerMonth: filteredAlertsPerMonth,
    hectaresTotal,
    hectaresPerMonth: filteredHectaresPerMonth,
  };
};

/**
 * Builds normalized monthly rows from cumulative statistics series.
 * These rows are reused for statistics exports across formats.
 *
 * @param {AlertsStatistics} alertsStatistics - Statistics payload to normalize.
 * @returns {MonthlySeriesRow[]} Ordered monthly rows with monthly and cumulative values.
 */
export const buildStatisticsMonthlyRows = (
  alertsStatistics: AlertsStatistics,
): MonthlySeriesRow[] => {
  const alertsMonthly = cumulativeToMonthly(alertsStatistics.alertsPerMonth);
  const hectaresMonthly = alertsStatistics.hectaresPerMonth
    ? cumulativeToMonthly(alertsStatistics.hectaresPerMonth)
    : null;

  return sortMonthKeys(Object.keys(alertsStatistics.alertsPerMonth)).map(
    (period) => ({
      period,
      alertsMonthly: Number((alertsMonthly[period] ?? 0).toFixed(2)),
      alertsCumulative: Number(
        (alertsStatistics.alertsPerMonth[period] ?? 0).toFixed(2),
      ),
      hectaresMonthly: hectaresMonthly
        ? Number((hectaresMonthly[period] ?? 0).toFixed(2))
        : null,
      hectaresCumulative: alertsStatistics.hectaresPerMonth
        ? Number((alertsStatistics.hectaresPerMonth[period] ?? 0).toFixed(2))
        : null,
    }),
  );
};

/**
 * Serializes normalized statistics rows to CSV including a final summary row.
 *
 * @param {MonthlySeriesRow[]} rows - Monthly statistics rows.
 * @param {StatisticsSummary} summary - Totals section for final summary row.
 * @returns {string} CSV content ready for download.
 */
export const statisticsRowsToCsv = (
  rows: MonthlySeriesRow[],
  summary: StatisticsSummary,
) => {
  const headers = [
    "rowType",
    "period",
    "alertsMonthly",
    "alertsCumulative",
    "hectaresMonthly",
    "hectaresCumulative",
    "alertsTotal",
    "hectaresTotal",
  ].map((key) => camelToSnake(key));

  return [
    headers.join(","),
    ...rows.map((row) =>
      [
        "monthly",
        row.period,
        row.alertsMonthly,
        row.alertsCumulative,
        row.hectaresMonthly ?? "",
        row.hectaresCumulative ?? "",
        "",
        "",
      ]
        .map((value) => escapeCSVValue(value))
        .join(","),
    ),
    [
      "summary",
      "",
      "",
      "",
      "",
      "",
      summary.alertsTotal,
      summary.hectaresTotal ?? "",
    ]
      .map((value) => escapeCSVValue(value))
      .join(","),
  ].join("\n");
};

/**
 * Serializes normalized statistics rows to a GeoJSON FeatureCollection
 * using null geometries and properties-only records.
 *
 * @param {MonthlySeriesRow[]} rows - Monthly statistics rows.
 * @param {StatisticsSummary} summary - Totals section for summary feature.
 * @returns {FeatureCollection} FeatureCollection containing monthly and summary features.
 */
export const statisticsRowsToFeatureCollection = (
  rows: MonthlySeriesRow[],
  summary: StatisticsSummary,
): FeatureCollection => {
  const features: Feature[] = rows.map((row) => ({
    type: "Feature",
    geometry: null,
    properties: {
      rowType: "monthly",
      period: row.period,
      alertsMonthly: row.alertsMonthly,
      alertsCumulative: row.alertsCumulative,
      hectaresMonthly: row.hectaresMonthly,
      hectaresCumulative: row.hectaresCumulative,
    },
  }));

  features.push({
    type: "Feature",
    geometry: null,
    properties: {
      rowType: "summary",
      alertsTotal: summary.alertsTotal,
      hectaresTotal: summary.hectaresTotal,
    },
  });

  return {
    type: "FeatureCollection",
    features,
  };
};
