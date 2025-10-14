import murmurhash from "murmurhash";

import {
  calculateCentroid,
  capitalizeFirstLetter,
  formatDate,
  getRandomColor,
} from "./helpers";

import type {
  Feature,
  FeatureCollection,
  Geometry,
  LineString,
  Polygon,
  Position,
} from "geojson";
import type {
  AlertsMetadata,
  AlertsPerMonth,
  MapStatistics,
  AlertsStatistics,
  DataEntry,
} from "@/types/types";

/**
 * Transforms survey data by modifying keys and values to a more readable format.
 *
 * This function processes an array of survey data entries, transforming both the keys
 * and values of each entry to enhance readability and consistency. The transformation
 * includes:
 * - Modifying key names by removing prefixes, replacing underscores with spaces, and
 *   standardizing certain key names (e.g., "today" becomes "dataCollectedOn").
 * - Adjusting value formats by replacing underscores and semicolons with spaces and commas,
 *   respectively, capitalizing the first letter, and formatting date-related values.
 * - Handling lists enclosed in square brackets by removing brackets and quotes, and
 *   joining items with commas.
 *
 * @param {DataEntry[]} data - An array of survey data entries to be transformed.
 * @returns {DataEntry[]} - A new array of data entries with transformed keys and values.
 */
const transformSurveyData = (data: DataEntry[]): DataEntry[] => {
  const transformSurveyDataKey = (key: string): string => {
    let transformedKey = key
      .replace(/^g__/, "geo")
      .replace(/^p__/, "")
      .replace(/_/g, " ");
    if (transformedKey.toLowerCase() === "today") {
      transformedKey = "dataCollectedOn";
    } else if (transformedKey.toLowerCase().includes("categoryid")) {
      transformedKey = "category";
    } else if (transformedKey.toLowerCase() === "id") {
      transformedKey = "id";
    }
    return transformedKey.trimStart();
  };

  const transformSurveyDataValue = (
    key: string,
    value: string | number | null,
  ) => {
    if (value === null) return null;
    if (key === "g__coordinates") return value;

    let transformedValue = value;
    if (typeof transformedValue === "string") {
      transformedValue = transformedValue
        .replace(/_/g, " ")
        .replace(/;/g, ", ");
      if (key.toLowerCase().includes("category")) {
        transformedValue = transformedValue.replace(/-/g, " ");
      }
      if (
        key.toLowerCase().includes("created") ||
        key.toLowerCase().includes("modified") ||
        key.toLowerCase().includes("updated")
      ) {
        transformedValue = formatDate(transformedValue);
      }
      transformedValue =
        transformedValue.charAt(0).toUpperCase() + transformedValue.slice(1);
    }
    // Handle lists enclosed in square brackets
    if (
      typeof transformedValue === "string" &&
      transformedValue.match(/^\[.*\]$/)
    ) {
      transformedValue = transformedValue
        .replace(/^\[|\]$/g, "")
        .split(", ")
        .map((item) => item.replace(/'/g, ""))
        .join(", ");
    }
    return transformedValue;
  };
  const transformedData = data.map((entry) => {
    const transformedEntry: DataEntry = {};
    Object.entries(entry).forEach(([key, value]) => {
      const transformedKey = transformSurveyDataKey(key);
      const transformedValue = transformSurveyDataValue(key, value);
      if (transformedValue !== null) {
        transformedEntry[transformedKey] = String(transformedValue);
      }
    });
    return transformedEntry;
  });

  return transformedData;
};

/**
 * Prepares and processes geospatial data for visualization on a map view.
 *
 * This function takes an array of data entries and an optional filter column,
 * and processes each entry to ensure it is ready for map visualization. It handles
 * the following tasks:
 *
 * 1. Determines the geometry type (Point, LineString, or Polygon) for each entry
 *    based on its coordinates and assigns it if not already specified.
 * 2. Parses and formats geocoordinates from string to JSON format suitable for
 *    map rendering.
 * 3. Assigns a unique color to each entry based on the specified filter column,
 *    ensuring consistent coloring for entries with the same filter value.
 *
 * @param {DataEntry[]} data - An array of data entries, where each entry is an object
 *                             containing geospatial information and other attributes.
 * @param {string | undefined} filterColumn - An optional column name used to filter
 *                                            and assign colors to data entries.
 * @returns {DataEntry[]} - An array of processed data entries, each with formatted
 *                          geocoordinates and assigned colors for map visualization.
 */
const prepareMapData = (
  data: DataEntry[],
  filterColumn: string | undefined,
): DataEntry[] => {
  const colorMap = new Map<string, string>();

  const processGeolocation = (obj: { [key: string]: string }) => {
    if (!obj.geocoordinates || obj.geocoordinates.trim() === "") {
      return obj;
    }
    try {
      const geometryType = obj.geotype;
      let coordinates: Position | LineString | Polygon = [];

      if (!Array.isArray(obj.geocoordinates)) {
        coordinates = JSON.parse(obj.geocoordinates);
      } else {
        coordinates = obj.geocoordinates;
      }
      if (
        geometryType === "Point" &&
        Array.isArray(coordinates) &&
        coordinates.length === 2
      ) {
        obj.geocoordinates = JSON.stringify(coordinates);
      } else if (geometryType === "LineString") {
        obj.geocoordinates = JSON.stringify(coordinates);
      } else if (geometryType === "Polygon") {
        obj.geocoordinates = JSON.stringify([coordinates]);
      }
    } catch (error) {
      console.error("Error parsing coordinates:", error);
    }
    return obj;
  };

  const processedGeoData = data.map((item) => {
    if (!item.geotype) {
      const coordinateKey = Object.keys(item).find((key) =>
        key.toLowerCase().includes("coordinates"),
      );
      if (coordinateKey) {
        const coordinates = JSON.parse(item[coordinateKey]);
        if (
          Array.isArray(coordinates) &&
          coordinates.length === 2 &&
          typeof coordinates[0] === "number" &&
          typeof coordinates[1] === "number"
        ) {
          item.geotype = "Point";
        } else {
          item.geotype = "Polygon";
        }
      }
    }

    const filterColumnValue =
      filterColumn !== undefined ? (item[filterColumn] ?? "") : "";
    if (filterColumnValue && !colorMap.has(filterColumnValue)) {
      colorMap.set(filterColumnValue, getRandomColor());
    }
    item["filter-color"] = colorMap.get(filterColumnValue) ?? "#3333FF";

    return processGeolocation(item);
  });

  return processedGeoData;
};

/**
 * Prepares and transforms alert data for display in the alerts view.
 *
 * This function processes a list of alert data entries, transforming each entry
 * to include only relevant information for display. It segregates the data into
 * two categories: the most recent alerts and previous alerts, based on the latest
 * detection date found in the data.
 *
 * The transformation includes:
 * - Filtering and retaining columns that start with 'g__'.
 * - Mapping satellite prefixes to their full names.
 * - Formatting and capitalizing specific fields such as territory name and data provider.
 * - Calculating geographic centroids for alert locations.
 * - Constructing URLs for alert imagery.
 *
 * @param {DataEntry[]} data - An array of data entries representing alerts.
 * @returns {Object} An object containing two arrays:
 *   - `mostRecentAlerts`: Alerts detected in the most recent month.
 *   - `previousAlerts`: Alerts detected in months prior to the most recent.
 */
const prepareAlertData = (
  data: DataEntry[],
): {
  mostRecentAlerts: DataEntry[];
  previousAlerts: DataEntry[];
} => {
  const transformChangeDetectionItem = (
    item: DataEntry,
    formattedMonth?: string,
  ): DataEntry => {
    const transformedItem: DataEntry = {};

    // Keep columns starting with 'g__'
    Object.keys(item).forEach((key) => {
      if (key.startsWith("g__")) {
        transformedItem[key] = item[key];
      }
    });

    if (item.data_source === "Global Forest Watch") {
      transformedItem["alertID"] = item.alert_id;
      transformedItem["confidenceLevel"] = item.confidence;
      transformedItem["alertType"] = item.alert_type?.replace(/_/g, " ") ?? "";
      transformedItem["dataProvider"] = capitalizeFirstLetter(item.data_source);
      transformedItem["geographicCentroid"] = calculateCentroid(
        item.g__coordinates,
      );
      transformedItem["YYYYMM"] = item.year_detec + item.month_detec;
      transformedItem["monthDetected"] =
        `${item.month_detec}-${item.year_detec}`;
      transformedItem["alertDetectionRange"] =
        `${item.date_start_t1} to ${item.date_end_t1}`;
      return transformedItem;
    }

    // To rewrite the satellite prefix column
    const satelliteLookup: { [key: string]: string } = {
      S1: "Sentinel-1",
      S2: "Sentinel-2",
      PS: "Planetscope",
      L8: "Landsat 8",
      L9: "Landsat 9",
      WV1: "WorldView-1",
      WV2: "WorldView-2",
      WV3: "WorldView-3",
      WV4: "WorldView-4",
      IK: "IKONOS",
    };

    // Include only the transformed columns
    transformedItem["territory"] = capitalizeFirstLetter(
      item.territory_name ?? "",
    );
    transformedItem["alertID"] = item.alert_id;
    transformedItem["alertDetectionRange"] =
      `${item.date_start_t1} to ${item.date_end_t1}`;
    transformedItem["monthDetected"] = `${formattedMonth}-${item.year_detec}`;
    transformedItem["YYYYMM"] = `${item.year_detec}${formattedMonth}`;
    transformedItem["dataProvider"] = capitalizeFirstLetter(
      `${item.data_source}`,
    );
    transformedItem["confidenceLevel"] = item.confidence;
    transformedItem["alertType"] = item.alert_type?.replace(/_/g, " ") ?? "";
    transformedItem["alertAreaHectares"] =
      typeof item.area_alert_ha === "number"
        ? (item.area_alert_ha as number).toFixed(2)
        : item.area_alert_ha;
    transformedItem["geographicCentroid"] = calculateCentroid(
      item.g__coordinates,
    );
    transformedItem["satelliteUsedForDetection"] =
      satelliteLookup[item.sat_detect_prefix] || item.sat_detect_prefix;

    transformedItem["t0_url"] =
      `alerts/${item.territory_id}/${item.year_detec}/${formattedMonth}/${item.alert_id}/images/${item.sat_viz_prefix}_T0_${item.alert_id}.jpg`;
    transformedItem["t1_url"] =
      `alerts/${item.territory_id}/${item.year_detec}/${formattedMonth}/${item.alert_id}/images/${item.sat_viz_prefix}_T1_${item.alert_id}.jpg`;
    transformedItem["previewImagerySource"] =
      satelliteLookup[item.sat_viz_prefix] || item.sat_viz_prefix;

    return transformedItem;
  };

  let latestProprietaryDate = new Date(0);
  let latestProprietaryMonthStr = "";

  const validGeoData = data.filter(isValidGeolocation);
  const proprietaryAlertData = validGeoData.filter(
    (d) => d.data_source !== "Global Forest Watch",
  );
  const gfwData = validGeoData.filter(
    (d) => d.data_source === "Global Forest Watch",
  );

  // First pass to find the latest date
  proprietaryAlertData.forEach((item) => {
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
  gfwData.forEach((item) => {
    const date = new Date(item.date_end_t1);
    if (date > latestGfwDate) latestGfwDate = date;
  });

  const mostRecentAlerts: DataEntry[] = [];
  const previousAlerts: DataEntry[] = [];

  // Second pass to segregate the data
  proprietaryAlertData.forEach((item) => {
    const formattedMonth =
      item.month_detec.length === 1 ? `0${item.month_detec}` : item.month_detec;
    const monthYearStr = `${formattedMonth}-${item.year_detec}`;
    const transformedItem = transformChangeDetectionItem(item, formattedMonth);

    // Segregate data based on the latest month detected
    if (monthYearStr === latestProprietaryMonthStr) {
      mostRecentAlerts.push(transformedItem);
    } else {
      previousAlerts.push(transformedItem);
    }
  });

  gfwData.forEach((item) => {
    const date = new Date(item.date_end_t1);
    const transformedItem = transformChangeDetectionItem(item);
    if (date.getTime() === latestGfwDate.getTime()) {
      mostRecentAlerts.push(transformedItem);
    } else {
      previousAlerts.push(transformedItem);
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
  const isGFW = data.some((item) => item.data_source === "Global Forest Watch");

  const territory = isGFW
    ? ""
    : data[0].territory_name.charAt(0).toUpperCase() +
      data[0].territory_name.slice(1);

  const typeOfAlerts = Array.from(
    new Set(
      data
        .map((item) => item.alert_type?.replace(/_/g, " "))
        .filter((alertType): alertType is string => alertType !== null),
    ),
  );

  const dataProviders = isGFW
    ? Array.from(new Set(data.map((item) => item.data_source).filter(Boolean)))
    : metadata
      ? Array.from(
          new Set(metadata.map((item) => item.data_source).filter(Boolean)),
        )
      : [];

  // Create Date objects for sorting and comparisons
  const formattedDates = data.map((item) => {
    return {
      date: new Date(
        `${item.year_detec}-${item.month_detec.padStart(2, "0")}-15`,
      ),
      dateString: `${item.month_detec.padStart(2, "0")}-${item.year_detec}`,
    };
  });

  // Sort dates to find the earliest and latest
  formattedDates.sort((a, b) => a.date.getTime() - b.date.getTime());

  let earliestDateStr, latestDateStr;
  let earliestDate: Date, latestDate: Date;

  if (metadata && metadata.length > 0) {
    // Find earliest and latest dates from metadata
    metadata.sort((a, b) =>
      a.year === b.year ? a.month - b.month : a.year - b.year,
    );
    const earliestMetadata = metadata[0];
    const latestMetadata = metadata[metadata.length - 1];

    earliestDate = new Date(
      earliestMetadata.year,
      earliestMetadata.month - 1,
      1,
    );
    latestDate = new Date(latestMetadata.year, latestMetadata.month - 1, 28);

    earliestDateStr = `${String(earliestMetadata.month).padStart(2, "0")}-${earliestMetadata.year}`;
    latestDateStr = `${String(latestMetadata.month).padStart(2, "0")}-${latestMetadata.year}`;
  } else {
    // If metadata is null, calculate earliest and latest dates from data
    earliestDate = formattedDates[0].date;
    earliestDate.setDate(1);
    earliestDateStr = formattedDates[0].dateString;

    latestDate = formattedDates[formattedDates.length - 1].date;
    latestDate.setDate(28);
    latestDateStr = formattedDates[formattedDates.length - 1].dateString;
  }

  // Create an array of all dates
  const allDates = Array.from(
    new Set(formattedDates.map((item) => item.dateString)),
  );

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
    let cumulativeValue = 0;
    const months = Object.keys(accumulatorMap);

    months.forEach((monthYear) => {
      if (property === "alerts") {
        const monthData = dataCollection.filter((item) => {
          const itemMonthYear = `${item.month_detec.padStart(2, "0")}-${item.year_detec}`;
          return itemMonthYear === monthYear;
        });
        cumulativeValue += monthData.length;
      } else if (property === "hectares" && !isGFW) {
        dataCollection.forEach((item) => {
          const monthYearItem = `${item.month_detec.padStart(2, "0")}-${item.year_detec}`;
          if (monthYearItem === monthYear) {
            const hectares = parseFloat(item.area_alert_ha);
            cumulativeValue += isNaN(hectares) ? 0 : hectares;
          }
        });
      }
      accumulatorMap[monthYear] = parseFloat(cumulativeValue.toFixed(2));
    });
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
  const recentAlertDate =
    last12MonthsData.length > 0
      ? `${last12MonthsData[last12MonthsData.length - 1].month_detec.padStart(2, "0")}-${last12MonthsData[last12MonthsData.length - 1].year_detec}`
      : "N/A";
  const recentAlertsNumber = data.filter((item) => {
    const itemDateStr = `${item.month_detec.padStart(2, "0")}-${item.year_detec}`;
    return itemDateStr === recentAlertDate;
  }).length;

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
 * Transforms data entries into a GeoJSON FeatureCollection.
 *
 * @param {DataEntry[]} data - An array of data entries to be transformed.
 * @returns {FeatureCollection} A GeoJSON FeatureCollection object.
 */
const transformToGeojson = (data: DataEntry[]): FeatureCollection => {
  const features = data.map((input) => {
    const feature: Feature = {
      type: "Feature",
      id: undefined,
      properties: {}, // Ensure properties is always an object
      geometry: {
        type: input.g__type as "Point" | "LineString" | "Polygon",
        coordinates: [],
      },
    };

    Object.entries(input).forEach(([key, value]) => {
      if (key === "alertID") {
        // Mapbox requires `feature.id` to be a 32-bit integer or a small string.
        // Some `alertID` values (e.g. "20240910100161660491") are too large to safely cast to Number,
        // which causes "given varint doesn't fit into 10 bytes" errors when rendering vector tiles.
        // We hash the `alertID` with MurmurHash to ensure a safe, deterministic 32-bit integer ID.
        feature.id = murmurhash.v3(String(value));
        feature.properties![key] = value; // Use non-null assertion
      } else if (key.startsWith("g__")) {
        const geometryKey = key.substring(3); // Removes 'g__' prefix
        if (feature.geometry) {
          if (geometryKey === "coordinates") {
            feature.geometry[geometryKey as keyof Geometry] = JSON.parse(
              String(value),
            );
          } else if (geometryKey === "type") {
            feature.geometry.type = String(value) as
              | "Point"
              | "LineString"
              | "Polygon";
          }
        }
      } else {
        feature.properties![key] = value; // Use non-null assertion
      }
    });

    return feature;
  });

  return {
    type: "FeatureCollection",
    features: features,
  };
};

/** Validates if a data entry has valid geolocation data. */
const isValidGeolocation = (item: DataEntry): boolean => {
  const validGeoTypes = [
    "LineString",
    "MultiLineString",
    "Point",
    "Polygon",
    "MultiPolygon",
  ];

  const isValidCoordinates = (
    type: string,
    coordinates: Geometry | string,
  ): boolean => {
    if (typeof coordinates === "string") {
      try {
        coordinates = JSON.parse(coordinates);
      } catch (error) {
        console.error("Error parsing coordinates:", error);
        return false;
      }
    }

    if (type === "Point") {
      return (
        Array.isArray(coordinates) &&
        coordinates.length === 2 &&
        coordinates.every(Number.isFinite)
      );
    } else if (type === "LineString" || type === "MultiLineString") {
      return (
        Array.isArray(coordinates) &&
        coordinates.every(
          (coord) =>
            Array.isArray(coord) &&
            coord.length === 2 &&
            coord.every(Number.isFinite),
        )
      );
    } else if (type === "Polygon") {
      return (
        Array.isArray(coordinates) &&
        coordinates.every(
          (ring) =>
            Array.isArray(ring) &&
            ring.every(
              (coord) =>
                Array.isArray(coord) &&
                coord.length === 2 &&
                coord.every(Number.isFinite),
            ),
        )
      );
    } else if (type === "MultiPolygon") {
      return (
        Array.isArray(coordinates) &&
        coordinates.every(
          (polygon) =>
            Array.isArray(polygon) &&
            polygon.every(
              (ring) =>
                Array.isArray(ring) &&
                ring.every(
                  (coord) =>
                    Array.isArray(coord) &&
                    coord.length === 2 &&
                    coord.every(Number.isFinite),
                ),
            ),
        )
      );
    }
    return false;
  };

  return (
    validGeoTypes.includes(item.g__type) &&
    isValidCoordinates(item.g__type, item.g__coordinates)
  );
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
  transformSurveyData,
  prepareMapData,
  prepareAlertData,
  prepareAlertsStatistics,
  prepareMapStatistics,
  transformToGeojson,
};
