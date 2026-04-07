import {
  calculateCentroidFromParsedCoords,
  tryParseAlertGeoCoordinates,
} from "@/utils/geoUtils";
import { formatLocaleDate } from "@/utils/dateUtils";
import type {
  AlertsMetadata,
  AlertsPerMonth,
  MapStatistics,
  AlertsStatistics,
  DataEntry,
} from "@/types";

/**
 * Splits raw alert data into most-recent and previous buckets, retaining
 * only the fields needed for map and other components (like `AlertsSlider.vue`)
 * rendering: _id, alertID, YYYYMM, geographicCentroid, and geometry (g__*).
 *
 * @param {DataEntry[]} data - Raw alert rows from the database.
 * @returns {{ mostRecentAlerts: DataEntry[], previousAlerts: DataEntry[] }}
 */
const prepareMinimalAlertEntries = (
  data: DataEntry[],
): {
  mostRecentAlerts: DataEntry[];
  previousAlerts: DataEntry[];
} => {
  let latestProprietaryDate = new Date(0);
  let latestProprietaryMonthStr = "";

  type GeoTagged = { item: DataEntry; parsedCoords: unknown };
  const proprietaryAlertData: GeoTagged[] = [];
  const gfwData: GeoTagged[] = [];

  for (const item of data) {
    const parsedCoords = tryParseAlertGeoCoordinates(item);
    if (parsedCoords === null) continue;
    if (item.data_source === "Global Forest Watch") {
      gfwData.push({ item, parsedCoords });
    } else {
      proprietaryAlertData.push({ item, parsedCoords });
    }
  }

  proprietaryAlertData.forEach(({ item }) => {
    const formattedMonth =
      item.month_detec.length === 1 ? `0${item.month_detec}` : item.month_detec;
    const monthYearStr = `${formattedMonth}-${item.year_detec}`;
    const date = new Date(
      parseInt(item.year_detec),
      parseInt(formattedMonth) - 1,
    );

    if (date > latestProprietaryDate) {
      latestProprietaryDate = date;
      latestProprietaryMonthStr = monthYearStr;
    }
  });

  let latestGfwDate = new Date(0);
  gfwData.forEach(({ item }) => {
    const date = new Date(item.date_end_t1);
    if (date > latestGfwDate) latestGfwDate = date;
  });

  const toMinimalEntry = (
    item: DataEntry,
    parsedCoords: unknown,
  ): DataEntry => {
    const formattedMonth = String(item.month_detec).padStart(2, "0");
    const entry: DataEntry = {};

    // Geometry fields
    for (const key in item) {
      if (
        Object.prototype.hasOwnProperty.call(item, key) &&
        key.startsWith("g__")
      ) {
        entry[key] = item[key];
      }
    }

    entry._id = item._id;
    entry.alertID = item.alert_id;
    entry.YYYYMM =
      item.data_source === "Global Forest Watch"
        ? item.year_detec + item.month_detec
        : `${item.year_detec}${formattedMonth}`;
    entry.geographicCentroid = calculateCentroidFromParsedCoords(parsedCoords);

    return entry;
  };

  const mostRecentAlerts: DataEntry[] = [];
  const previousAlerts: DataEntry[] = [];

  proprietaryAlertData.forEach(({ item, parsedCoords }) => {
    const formattedMonth =
      item.month_detec.length === 1 ? `0${item.month_detec}` : item.month_detec;
    const monthYearStr = `${formattedMonth}-${item.year_detec}`;

    if (monthYearStr === latestProprietaryMonthStr) {
      mostRecentAlerts.push(toMinimalEntry(item, parsedCoords));
    } else {
      previousAlerts.push(toMinimalEntry(item, parsedCoords));
    }
  });

  gfwData.forEach(({ item, parsedCoords }) => {
    const date = new Date(item.date_end_t1);
    if (date.getTime() === latestGfwDate.getTime()) {
      mostRecentAlerts.push(toMinimalEntry(item, parsedCoords));
    } else {
      previousAlerts.push(toMinimalEntry(item, parsedCoords));
    }
  });

  return { mostRecentAlerts, previousAlerts };
};

/**
 * Prepares statistical data for the alerts view introduction panel.
 *
 * This function processes alert data and optional metadata to generate
 * statistics for display. It calculates the range of alert detection dates,
 * identifies unique alert types and data providers, and computes cumulative
 * alert counts and areas over the last 12 months.
 *
 * The statistics include:
 * - Territory name with proper capitalization.
 * - Unique types of alerts and data providers.
 * - Date range for alert detection.
 * - Cumulative alerts and hectares per month for the last 12 months.
 * - Total number of alerts and total area affected in hectares.
 *
 * @param {DataEntry[]} data - An array of data entries representing alerts.
 * @param {AlertsMetadata[] | null} metadata - Optional metadata for additional context.
 * @returns {AlertsStatistics} An object containing various statistics for the alerts view.
 */

const prepareAlertsStatistics = (
  data: DataEntry[],
  metadata: AlertsMetadata[] | null,
): AlertsStatistics => {
  // Extract data providers from metadata (reusable for empty data case)
  const getDataProvidersFromMetadata = (): string[] => {
    return metadata && metadata.length > 0
      ? Array.from(
          new Set(metadata.map((item) => item.data_source).filter(Boolean)),
        )
      : [];
  };

  // Extract date range from metadata (reusable for empty data case)
  const getDateRangeFromMetadata = (): {
    earliestDateStr: string;
    latestDateStr: string;
    earliestDate: Date;
    latestDate: Date;
  } | null => {
    if (!metadata || metadata.length === 0) return null;

    const sortedMeta = [...metadata].sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year;
      if (a.month !== b.month) return a.month - b.month;
      return (a.day ?? 0) - (b.day ?? 0);
    });
    const earliestMetadata = sortedMeta[0];
    const latestMetadata = sortedMeta[sortedMeta.length - 1];

    return {
      earliestDate: new Date(
        earliestMetadata.year,
        earliestMetadata.month - 1,
        earliestMetadata.day ?? 1,
      ),
      latestDate: new Date(
        latestMetadata.year,
        latestMetadata.month - 1,
        latestMetadata.day ?? 28,
      ),
      earliestDateStr: formatLocaleDate(
        earliestMetadata.month,
        earliestMetadata.year,
        earliestMetadata.day,
      ),
      latestDateStr: formatLocaleDate(
        latestMetadata.month,
        latestMetadata.year,
        latestMetadata.day,
      ),
    };
  };

  // Handle empty data case - but still use metadata if available
  if (data.length === 0) {
    const now = new Date();
    const currentDateStr = `${String(now.getMonth() + 1).padStart(2, "0")}-${now.getFullYear()}`;

    const dataProviders = getDataProvidersFromMetadata();
    const metadataDateRange = getDateRangeFromMetadata();

    const alertDetectionRange = metadataDateRange
      ? `${metadataDateRange.earliestDateStr} to ${metadataDateRange.latestDateStr}`
      : "N/A";
    const earliestDateStr =
      metadataDateRange?.earliestDateStr ?? currentDateStr;

    return {
      territory: "",
      typeOfAlerts: [],
      dataProviders,
      alertDetectionRange,
      allDates: [],
      earliestAlertsDate: earliestDateStr,
      recentAlertsDate: "N/A",
      recentAlertsNumber: 0,
      alertsTotal: 0,
      alertsPerMonth: {},
      hectaresTotal: null,
      hectaresPerMonth: null,
      twelveMonthsBefore: currentDateStr,
    };
  }

  const isGFW = data.some((item) => item.data_source === "Global Forest Watch");

  const territory = isGFW
    ? ""
    : data[0].territory_name.charAt(0).toUpperCase() +
      data[0].territory_name.slice(1);

  const typeOfAlertsSet = new Set<string>();
  for (const item of data) {
    const alertType = item.alert_type?.replace(/_/g, " ");
    if (alertType != null) {
      typeOfAlertsSet.add(alertType);
    }
  }
  const typeOfAlerts = Array.from(typeOfAlertsSet);

  const dataProviders = isGFW
    ? Array.from(new Set(data.map((item) => item.data_source).filter(Boolean)))
    : getDataProvidersFromMetadata();

  // Create Date objects for sorting and comparisons
  const formattedDates = data.map((item) => {
    const mm = item.month_detec.padStart(2, "0");
    const dayNum = item.day_detec ? parseInt(item.day_detec) : 15;
    return {
      date: new Date(
        `${item.year_detec}-${mm}-${String(dayNum).padStart(2, "0")}`,
      ),
      dateString: `${mm}-${item.year_detec}`,
      displayString: formatLocaleDate(
        item.month_detec,
        item.year_detec,
        item.day_detec,
      ),
    };
  });

  // Sort dates to find the earliest and latest
  formattedDates.sort((a, b) => a.date.getTime() - b.date.getTime());

  let earliestDateStr, latestDateStr;
  let earliestDate: Date, latestDate: Date;

  const metadataDateRange = getDateRangeFromMetadata();
  if (metadataDateRange) {
    earliestDate = metadataDateRange.earliestDate;
    latestDate = metadataDateRange.latestDate;
    earliestDateStr = metadataDateRange.earliestDateStr;
    latestDateStr = metadataDateRange.latestDateStr;
  } else {
    // If metadata is null, calculate earliest and latest dates from data
    earliestDate = formattedDates[0].date;
    earliestDate.setDate(1);
    earliestDateStr = formattedDates[0].displayString;

    latestDate = formattedDates[formattedDates.length - 1].date;
    latestDate.setDate(28);
    latestDateStr = formattedDates[formattedDates.length - 1].displayString;
  }

  // Create an array of all dates
  const uniqueDateStrings = new Set<string>();
  for (const fd of formattedDates) {
    uniqueDateStrings.add(fd.dateString);
  }
  const allDates = Array.from(uniqueDateStrings);

  // Determine the date 12 months before the latest date
  const twelveMonthsBefore = new Date(latestDate);
  twelveMonthsBefore.setFullYear(twelveMonthsBefore.getFullYear() - 1);

  // Filter and sort the data for the last 12 months
  const last12MonthsData = data
    .filter((item) => {
      const itemDate = new Date(
        `${item.year_detec}-${item.month_detec.padStart(2, "0")}-01`,
      );
      return itemDate >= twelveMonthsBefore && itemDate <= latestDate;
    })
    .sort((a, b) => {
      const aDate = new Date(
        `${a.year_detec}-${a.month_detec.padStart(2, "0")}`,
      );
      const bDate = new Date(
        `${b.year_detec}-${b.month_detec.padStart(2, "0")}`,
      );
      return aDate.getTime() - bDate.getTime();
    });

  const twelveMonthsBeforeStr = `${
    twelveMonthsBefore.getMonth() + 1
  }-${twelveMonthsBefore.getFullYear()}`;

  const getUpTo12MonthsForChart = (): string[] => {
    const months = [];

    // We have to use UTC here to avoid issues with local time settings
    const currentDate = new Date(
      Date.UTC(latestDate.getUTCFullYear(), latestDate.getUTCMonth(), 15),
    );

    for (let i = 0; i < 12; i++) {
      // Decrement the month in currentDate, after the first iteration (latestDate).
      // This moves the date back by one month at a time.
      if (i > 0) {
        currentDate.setMonth(currentDate.getMonth() - 1);
      }

      // Format the month part of the currentDate to ensure it has two digits.
      // This is necessary as months are 0-indexed in JavaScript,
      // so January is 0, February is 1, and so on.
      const month = String(currentDate.getUTCMonth() + 1).padStart(2, "0");
      const year = currentDate.getUTCFullYear();
      const monthYear = `${month}-${year}`;

      // Check if this currentDate falls within the range of earliestDate and latestDate.
      // If it does, add the monthYear string to the months array.
      if (currentDate >= earliestDate && currentDate <= latestDate) {
        months.push(monthYear);
      }
    }

    // Reverse the months array to have the dates in ascending order.
    months.reverse();
    return months;
  };

  // Helper function to update months cumulatively
  // Whether it be alerts or hectares
  const updateCumulativeData = (
    dataCollection: DataEntry[],
    accumulatorMap: Record<string, number>,
    property: "alerts" | "hectares",
  ) => {
    const monthKeys = Object.keys(accumulatorMap);

    if (property === "alerts") {
      const countsByMonth = new Map<string, number>();
      for (const item of dataCollection) {
        const key = `${item.month_detec.padStart(2, "0")}-${item.year_detec}`;
        countsByMonth.set(key, (countsByMonth.get(key) ?? 0) + 1);
      }
      let cumulativeValue = 0;
      for (const monthYear of monthKeys) {
        cumulativeValue += countsByMonth.get(monthYear) ?? 0;
        accumulatorMap[monthYear] = parseFloat(cumulativeValue.toFixed(2));
      }
      return;
    }

    if (property === "hectares" && !isGFW) {
      const hectaresByMonth = new Map<string, number>();
      for (const item of dataCollection) {
        const key = `${item.month_detec.padStart(2, "0")}-${item.year_detec}`;
        const hectares = parseFloat(item.area_alert_ha);
        const add = isNaN(hectares) ? 0 : hectares;
        hectaresByMonth.set(key, (hectaresByMonth.get(key) ?? 0) + add);
      }
      let cumulativeValue = 0;
      for (const monthYear of monthKeys) {
        cumulativeValue += hectaresByMonth.get(monthYear) ?? 0;
        accumulatorMap[monthYear] = parseFloat(cumulativeValue.toFixed(2));
      }
    }
  };

  // Initialize alertsPerMonth and hectaresPerMonth
  const alertsPerMonth: AlertsPerMonth = {};
  const hectaresPerMonth: AlertsPerMonth = {};
  const months = getUpTo12MonthsForChart();

  months.forEach((monthYear) => {
    alertsPerMonth[monthYear] = 0;
    hectaresPerMonth[monthYear] = 0;
  });

  // Populate alertsPerMonth and hectaresPerMonth using the helper function
  updateCumulativeData(last12MonthsData, alertsPerMonth, "alerts");
  updateCumulativeData(last12MonthsData, hectaresPerMonth, "hectares");

  // Count the number of alerts for the most recent date
  const lastItem =
    last12MonthsData.length > 0
      ? last12MonthsData[last12MonthsData.length - 1]
      : null;
  const recentMonthYear = lastItem
    ? `${lastItem.month_detec.padStart(2, "0")}-${lastItem.year_detec}`
    : "N/A";
  const recentAlertDate = lastItem
    ? formatLocaleDate(
        lastItem.month_detec,
        lastItem.year_detec,
        lastItem.day_detec,
      )
    : "N/A";
  let recentAlertsNumber = 0;
  if (recentMonthYear !== "N/A") {
    for (const item of data) {
      const itemDateStr = `${item.month_detec.padStart(2, "0")}-${item.year_detec}`;
      if (itemDateStr === recentMonthYear) {
        recentAlertsNumber++;
      }
    }
  }

  // Calculate total number of alerts
  const alertsTotal = data.length;

  // Calculate total hectares
  const hectaresTotal = isGFW
    ? null
    : data
        .reduce(
          (total, item) => total + parseFloat(item.area_alert_ha || "0"),
          0,
        )
        .toFixed(2);

  return {
    territory,
    typeOfAlerts,
    dataProviders,
    alertDetectionRange: `${earliestDateStr} to ${latestDateStr}`,
    allDates,
    earliestAlertsDate: earliestDateStr,
    recentAlertsDate: recentAlertDate,
    recentAlertsNumber,
    alertsTotal,
    alertsPerMonth,
    hectaresTotal,
    hectaresPerMonth: isGFW ? null : hectaresPerMonth,
    twelveMonthsBefore: twelveMonthsBeforeStr,
  };
};

/**
 * Prepares statistical data for the map view introduction panel.
 *
 * This function processes map data to generate statistics for display.
 * It calculates the total number of features, counts geometry types,
 * and determines date ranges if the data contains valid dates.
 *
 * @param {DataEntry[]} data - An array of data entries representing map features.
 * @returns {MapStatistics} An object containing various statistics for the map view.
 */
const prepareMapStatistics = (data: DataEntry[]): MapStatistics => {
  if (!data || data.length === 0) {
    return {
      totalFeatures: 0,
    };
  }

  // Calculate date range (look for date-related columns)
  let dateRange: string | undefined;
  const dateColumns = Object.keys(data[0] || {}).filter((key) => {
    const lowerKey = key.toLowerCase();
    return (
      lowerKey.includes("date") ||
      lowerKey.includes("time") ||
      lowerKey.includes("created") ||
      lowerKey.includes("modified") ||
      lowerKey.includes("updated")
    );
  });

  if (dateColumns.length > 0) {
    const dates = data
      .map((item) => {
        for (const col of dateColumns) {
          if (item[col]) {
            const value = String(item[col]);
            // Check if the value looks like a date (contains digits and common date separators)
            // Pattern matches dates like: 2024-01-15, 01/15/2024, 3/9/2024, 2024, etc.
            if (
              /\d/.test(value) &&
              (/[-/]/.test(value) || /^\d{4}$/.test(value))
            ) {
              return value;
            }
          }
        }
        return null;
      })
      .filter(Boolean)
      .sort();

    if (dates.length > 0) {
      dateRange = `${dates[0]} to ${dates[dates.length - 1]}`;
    }
  }

  return {
    totalFeatures: data.length,
    dateRange,
  };
};

export {
  prepareAlertsStatistics,
  prepareMapStatistics,
  prepareMinimalAlertEntries,
};
