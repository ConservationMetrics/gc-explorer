import murmurhash from "murmurhash";

import { describe, it, expect } from "vitest";

import {
  transformSurveyData,
  prepareMapData,
  prepareAlertData,
  prepareAlertsStatistics,
  prepareMapStatistics,
  transformToGeojson,
} from "@/server/dataProcessing/transformData";
import { isValidCoordinate } from "@/server/dataProcessing/helpers";
import { mapeoData, transformedMapeoData } from "../fixtures/mapeoData";
import { alertsData, alertsMetadata } from "../fixtures/alertsData";

describe("transformSurveyData", () => {
  it("should transform survey data keys and values", () => {
    const result = transformSurveyData(mapeoData);

    result.forEach((item) => {
      expect(item).not.toHaveProperty("g__coordinates");
      expect(item).toHaveProperty("geocoordinates");
      expect(item.category[0]).toBe(item.category[0].toUpperCase());
      expect(item.created).toMatch(/^\d{1,2}\/\d{1,2}\/\d{4}$/);
      expect(item.photos).toMatch(/^(\w+\.jpg(, )?)*\w+\.jpg$|^$/);
      expect(item).toHaveProperty("id");
    });
  });
});

describe("prepareMapData", () => {
  it("should prepare map data", () => {
    const result = prepareMapData(transformedMapeoData, "category");

    let randomColorForHouseCategory: string | null = null;

    result.forEach((item) => {
      expect(item).toHaveProperty("filter-color");
      if (item.geocoordinates !== "") {
        expect(item["geotype"]).toBe("Point");
      }
      if (item.category === "House") {
        if (!randomColorForHouseCategory) {
          randomColorForHouseCategory = item["filter-color"];
        }
        expect(item["filter-color"]).toBe(randomColorForHouseCategory);
      }
    });
  });
});

describe("prepareMapStatistics", () => {
  it("should calculate map statistics from transformed mapeo data", () => {
    const result = prepareMapStatistics(transformedMapeoData);

    expect(result.totalFeatures).toBe(3);
    expect(result.dateRange).toBe("3/9/2024 to 3/9/2024");
  });

  it("should return zero statistics for empty data", () => {
    const result = prepareMapStatistics([]);

    expect(result.totalFeatures).toBe(0);
    expect(result.dateRange).toBeUndefined();
  });

  it("should not include non-date values in date range", () => {
    const dataWithNonDateColumn = [
      {
        ID: "test123",
        geocoordinates: "[-1.0, 1.0]",
        geotype: "Point",
        "date-field": "not-a-date-value",
        category: "Test",
      },
    ];

    const result = prepareMapStatistics(dataWithNonDateColumn);

    expect(result.dateRange).toBeUndefined();
  });
});

describe("prepareAlertData", () => {
  it("should prepare alert data for the alerts dashboard", () => {
    const result = prepareAlertData(alertsData);

    result.mostRecentAlerts.forEach((item) => {
      expect(item).toHaveProperty("alertDetectionRange");
      expect(item).toHaveProperty("previewImagerySource");
      expect(item).toHaveProperty("alertType");
      expect(item).toHaveProperty("alertAreaHectares");
      expect(item).toHaveProperty("satelliteUsedForDetection");
      expect(item.previewImagerySource).toBe("Sentinel-2");
    });

    // 2 of the 3 alerts are the most recent alerts
    expect(result.mostRecentAlerts).toHaveLength(2);
    expect(result.previousAlerts).toHaveLength(1);

    // alertDetectionRange should be a string in the format "YYYY-MM-DD to YYYY-MM-DD"
    expect(result.mostRecentAlerts[0].alertDetectionRange).toMatch(
      /^\d{4}-\d{2}-\d{2} to \d{4}-\d{2}-\d{2}$/,
    );

    // Validate geographicCentroid field to be a valid coordinate pair
    const geographicCentroid = result.mostRecentAlerts[0].geographicCentroid;
    const coordinatePattern = /^-?\d{1,3}\.\d{6}, -?\d{1,3}\.\d{6}$/;
    expect(geographicCentroid).toMatch(coordinatePattern);
    const [latitude, longitude] = geographicCentroid.split(", ").map(Number);
    expect(isValidCoordinate(latitude)).toBe(true);
    expect(isValidCoordinate(longitude)).toBe(true);
  });
});

describe("prepareAlertsStatistics", () => {
  it("should prepare alert statistics", () => {
    const result = prepareAlertsStatistics(alertsData, alertsMetadata);

    expect(result.territory).toBe("Mountain valley");
    expect(result.typeOfAlerts).toEqual([
      "gold mining",
      "wildlife trafficking",
    ]);
    expect(result.dataProviders).toEqual(["alerts_provider"]);
    expect(result.alertDetectionRange).toBe("01-2023 to 01-2024");
    expect(result.allDates).toEqual(["01-2023", "01-2024"]);
    expect(result.earliestAlertsDate).toBe("01-2023");
    expect(result.recentAlertsDate).toBe("01-2024");
    expect(result.recentAlertsNumber).toBe(2);
    expect(result.alertsTotal).toBe(3);
    expect(result.alertsPerMonth["01-2024"]).toEqual(2);
    expect(result.hectaresTotal).toBe("6.96");
    expect(result.hectaresPerMonth?.["01-2024"]).toEqual(3.59);
    expect(result.twelveMonthsBefore).toBe("1-2023");
  });
});

describe("transformToGeojson", () => {
  it("should transform data to GeoJSON", () => {
    const result = transformToGeojson(
      prepareAlertData(alertsData).mostRecentAlerts,
    );

    expect(result).toHaveProperty("type");
    expect(result.type).toBe("FeatureCollection");
    expect(result).toHaveProperty("features");
    expect(result.features).toBeInstanceOf(Array);
    result.features.forEach((feature, index) => {
      expect(feature).toHaveProperty("type");
      expect(feature.type).toBe("Feature");
      expect(feature).toHaveProperty("properties");
      expect(feature).toHaveProperty("geometry");
      expect(feature).toHaveProperty("id");
      // Check if the alert._id is properly transformed to feature.id using murmurhash
      const expectedId = murmurhash.v3(String(alertsData[index].alert_id));
      expect(feature.id).toBe(expectedId);
    });
    expect(result.features).toHaveLength(2);
  });
});
