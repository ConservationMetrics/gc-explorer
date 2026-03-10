import { describe, it, expect } from "vitest";

import {
  prepareAlertsStatistics,
  prepareMapStatistics,
  prepareMinimalAlertEntries,
} from "@/server/dataProcessing/dataTransformers";
import { transformedMapeoData } from "../fixtures/mapeoData";
import { alertsData, alertsMetadata } from "../fixtures/alertsData";

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

describe("prepareMinimalAlertEntries", () => {
  it("should split alerts into most-recent and previous buckets", () => {
    const result = prepareMinimalAlertEntries(alertsData);

    expect(result.mostRecentAlerts).toHaveLength(2);
    expect(result.previousAlerts).toHaveLength(1);
  });

  it("should include only minimal fields per entry", () => {
    const result = prepareMinimalAlertEntries(alertsData);
    const entry = result.mostRecentAlerts[0];

    expect(entry).toHaveProperty("_id");
    expect(entry).toHaveProperty("alertID");
    expect(entry).toHaveProperty("YYYYMM");
    expect(entry).toHaveProperty("geographicCentroid");
    expect(entry).toHaveProperty("g__type");
    expect(entry).toHaveProperty("g__coordinates");

    // Should NOT have full-transform fields
    expect(entry).not.toHaveProperty("alertDetectionRange");
    expect(entry).not.toHaveProperty("alertType");
    expect(entry).not.toHaveProperty("alertAreaHectares");
    expect(entry).not.toHaveProperty("satelliteUsedForDetection");
    expect(entry).not.toHaveProperty("territory");
    expect(entry).not.toHaveProperty("t0_url");
    expect(entry).not.toHaveProperty("t1_url");
  });

  it("should produce a valid YYYYMM for date filtering", () => {
    const result = prepareMinimalAlertEntries(alertsData);

    result.mostRecentAlerts.forEach((entry) => {
      expect(entry.YYYYMM).toMatch(/^\d{6}$/);
    });
    result.previousAlerts.forEach((entry) => {
      expect(entry.YYYYMM).toMatch(/^\d{6}$/);
    });
  });

  it("should compute a valid geographicCentroid", () => {
    const result = prepareMinimalAlertEntries(alertsData);
    const coordPattern = /^-?\d{1,3}\.\d+, -?\d{1,3}\.\d+$/;

    result.mostRecentAlerts.forEach((entry) => {
      expect(entry.geographicCentroid).toMatch(coordPattern);
    });
  });

  it("should preserve alert_id as alertID", () => {
    const result = prepareMinimalAlertEntries(alertsData);

    expect(result.mostRecentAlerts[0].alertID).toBe(alertsData[0].alert_id);
  });
});
