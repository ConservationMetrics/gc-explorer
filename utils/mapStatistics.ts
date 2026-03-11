import type { FeatureCollection } from "geojson";
import type { MapStatistics } from "@/types";

/**
 * Derives map statistics from a GeoJSON FeatureCollection.
 * totalFeatures is the number of features; dateRange is derived from
 * feature properties using date-like column names (date, time, created, modified, updated).
 *
 * @param {FeatureCollection} collection - GeoJSON FeatureCollection.
 * @returns {MapStatistics} totalFeatures and optional dateRange.
 */
export const mapStatisticsFromFeatureCollection = (
  collection: FeatureCollection,
): MapStatistics => {
  const features = collection?.features ?? [];
  if (features.length === 0) {
    return { totalFeatures: 0 };
  }

  let dateRange: string | undefined;
  const firstProps = features[0]?.properties;
  const dateColumns = firstProps
    ? Object.keys(firstProps).filter((key) => {
        const lowerKey = key.toLowerCase();
        return (
          lowerKey.includes("date") ||
          lowerKey.includes("time") ||
          lowerKey.includes("created") ||
          lowerKey.includes("modified") ||
          lowerKey.includes("updated")
        );
      })
    : [];

  if (dateColumns.length > 0) {
    const dates = features
      .map((feature) => {
        const props = feature.properties;
        if (!props) return null;
        for (const col of dateColumns) {
          const raw = props[col];
          if (raw != null && raw !== "") {
            const value = String(raw);
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
      .filter((v): v is string => v != null)
      .sort();

    if (dates.length > 0) {
      dateRange = `${dates[0]} to ${dates[dates.length - 1]}`;
    }
  }

  return {
    totalFeatures: features.length,
    dateRange,
  };
};
