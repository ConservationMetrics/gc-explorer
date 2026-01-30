import { computed, nextTick, ref, type Ref, type ComputedRef } from "vue";
import type mapboxgl from "mapbox-gl";
import type { Feature } from "geojson";
import type { AlertsData, AlertsStatistics } from "@/types/types";

/**
 * Composable for managing alerts date range filtering.
 * Handles date range selection, filtering alerts data, and updating map sources.
 */
export function useAlertsDateFilter(
  map: Ref<mapboxgl.Map | undefined>,
  alertsData: Ref<AlertsData>,
  alertsStatistics: Ref<AlertsStatistics>,
  localAlertsData: Ref<Feature | AlertsData>,
  t: (key: string) => string,
) {
  const selectedDateRange = ref<[string, string] | undefined>();

  /**
   * Converts date strings from "MM-YYYY" format to "YYYYMM" format for comparison.
   * If the start or end date is "earlier", it substitutes with the earliest or twelve months before date.
   */
  const convertDates = (start: string, end: string) => {
    const convertToDate = (dateStr: string) => {
      const [month, year] = dateStr.split("-").map(Number);
      return (year * 100 + month).toString();
    };

    if (start === t("earlier")) {
      start = alertsStatistics.value.earliestAlertsDate;
    }

    if (end === t("earlier")) {
      end = alertsStatistics.value.twelveMonthsBefore;
    }

    const startDate = convertToDate(start);
    const endDate = convertToDate(end);

    return [startDate, endDate];
  };

  /**
   * Retrieves date options for selection, replacing earlier dates with "Earlier" if there are more than 12 dates.
   * @returns {string[]} - An array of date options.
   */
  const getDateOptions = () => {
    let dates = alertsStatistics.value.allDates;

    if (dates.length > 12) {
      const last12Dates = dates.slice(-12);
      dates = [t("earlier"), ...last12Dates];
    }

    return dates;
  };

  /**
   * Computes filtered data based on the selected date range.
   * If no date range is selected, returns the full alerts data.
   * @returns {Object} - The filtered alerts data.
   */
  const filteredData: ComputedRef<AlertsData> = computed(() => {
    if (!selectedDateRange.value) {
      return alertsData.value;
    }

    const [start, end] = selectedDateRange.value;
    const [startDate, endDate] = convertDates(start, end);

    const filterFeatures = (features: Feature[]) => {
      return features.filter((feature) => {
        const monthDetected = feature.properties
          ? feature.properties["YYYYMM"]
          : null;
        return monthDetected >= startDate && monthDetected <= endDate;
      });
    };

    return {
      mostRecentAlerts: {
        ...alertsData.value.mostRecentAlerts,
        features: filterFeatures(alertsData.value.mostRecentAlerts.features),
      },
      previousAlerts: {
        ...alertsData.value.previousAlerts,
        features: filterFeatures(alertsData.value.previousAlerts.features),
      },
    };
  });

  /**
   * Handles changes in the selected date range, updating map layers to show features within the new range.
   * @param {[string, string]} newRange - The new date range as an array of start and end dates.
   */
  const handleDateRangeChanged = (newRange: [string, string]) => {
    // Extract start and end dates from newRange
    let [start, end] = newRange;

    if (start === t("earlier")) {
      start = alertsStatistics.value.earliestAlertsDate;
    }

    if (end === t("earlier")) {
      end = alertsStatistics.value.twelveMonthsBefore;
    }

    // Update the selected date range first so filteredData is computed correctly
    selectedDateRange.value = newRange;

    // Update the layers to only show features within the selected date range
    nextTick(() => {
      if (!map.value) return;

      // Update source data for all alert sources so clusters reflect filtered data
      const sourceIds = [
        "most-recent-alerts-point",
        "most-recent-alerts-polygon",
        "most-recent-alerts-linestring",
        "most-recent-alerts-centroids",
        "previous-alerts-point",
        "previous-alerts-polygon",
        "previous-alerts-linestring",
        "previous-alerts-centroids",
      ];

      sourceIds.forEach((sourceId) => {
        const source = map.value!.getSource(sourceId) as mapboxgl.GeoJSONSource;
        if (!source) return;

        const isMostRecent = sourceId.startsWith("most-recent-alerts");
        const filteredFeatures = isMostRecent
          ? filteredData.value.mostRecentAlerts.features
          : filteredData.value.previousAlerts.features;

        if (sourceId.endsWith("-point")) {
          // Point source: filter by Point geometry type
          const pointFeatures = filteredFeatures.filter(
            (f) => f.geometry.type === "Point",
          );
          source.setData({
            type: "FeatureCollection",
            features: pointFeatures,
          });
        } else if (sourceId.endsWith("-polygon")) {
          // Polygon source: filter by Polygon/MultiPolygon geometry type
          const polygonFeatures = filteredFeatures.filter(
            (f) =>
              f.geometry.type === "Polygon" ||
              f.geometry.type === "MultiPolygon",
          );
          source.setData({
            type: "FeatureCollection",
            features: polygonFeatures,
          });
        } else if (sourceId.endsWith("-linestring")) {
          // LineString source: filter by LineString geometry type
          const linestringFeatures = filteredFeatures.filter(
            (f) => f.geometry.type === "LineString",
          );
          source.setData({
            type: "FeatureCollection",
            features: linestringFeatures,
          });
        } else if (sourceId.endsWith("-centroids")) {
          // Centroid source: create Point features from geographicCentroid
          const centroidFeatures = filteredFeatures
            .filter(
              (f) =>
                f.properties?.geographicCentroid && f.geometry.type !== "Point",
            )
            .map((feature) => ({
              type: "Feature" as const,
              geometry: {
                type: "Point" as const,
                coordinates: feature.properties?.geographicCentroid
                  .split(",")
                  .map(Number)
                  .reverse(),
              },
              properties: {
                ...feature.properties,
              },
            }));
          source.setData({
            type: "FeatureCollection",
            features: centroidFeatures,
          });
        }
      });

      // Update layer filters for non-clustered features (still needed for unclustered points/centroids)
      map.value.getStyle().layers.forEach((layer) => {
        if (
          (layer.id.startsWith("most-recent-alerts") ||
            layer.id.startsWith("previous-alerts")) &&
          // Don't apply filters to cluster layers - they don't have feature properties
          !layer.id.includes("-cluster")
        ) {
          // For point and centroid layers, only need cluster exclusion filter
          // (date filtering is handled by source data update above)
          if (layer.id.endsWith("-point") || layer.id.endsWith("-centroids")) {
            map.value!.setFilter(layer.id, ["!", ["has", "point_count"]]);
          } else {
            // For polygon/linestring layers, remove filters (source data handles filtering)
            map.value!.setFilter(layer.id, null);
          }
        }
      });

      // Update localAlertsData to match the data with the selected date range
      localAlertsData.value = filteredData.value;
    });
  };

  /**
   * Resets the selected date range to null.
   */
  const resetDateRange = () => {
    selectedDateRange.value = undefined;
  };

  return {
    selectedDateRange,
    filteredData,
    getDateOptions,
    handleDateRangeChanged,
    resetDateRange,
  };
}
