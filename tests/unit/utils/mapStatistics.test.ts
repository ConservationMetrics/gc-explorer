import { describe, it, expect } from "vitest";
import { mapStatisticsFromFeatureCollection } from "@/utils/mapStatistics";
import type { FeatureCollection } from "geojson";

describe("mapStatisticsFromFeatureCollection", () => {
  it("returns totalFeatures 0 for empty collection", () => {
    const collection: FeatureCollection = {
      type: "FeatureCollection",
      features: [],
    };
    const result = mapStatisticsFromFeatureCollection(collection);
    expect(result.totalFeatures).toBe(0);
    expect(result.dateRange).toBeUndefined();
  });

  it("returns totalFeatures 1 and no dateRange when no date-like properties", () => {
    const collection: FeatureCollection = {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          geometry: { type: "Point", coordinates: [0, 0] },
          properties: { name: "A", category: "X" },
        },
      ],
    };
    const result = mapStatisticsFromFeatureCollection(collection);
    expect(result.totalFeatures).toBe(1);
    expect(result.dateRange).toBeUndefined();
  });

  it("returns totalFeatures and dateRange from features with date column", () => {
    const collection: FeatureCollection = {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          geometry: { type: "Point", coordinates: [0, 0] },
          properties: { created_at: "2025-01-10", id: "1" },
        },
        {
          type: "Feature",
          geometry: { type: "Point", coordinates: [1, 1] },
          properties: { created_at: "2025-03-15", id: "2" },
        },
        {
          type: "Feature",
          geometry: { type: "Point", coordinates: [2, 2] },
          properties: { created_at: "2025-02-01", id: "3" },
        },
      ],
    };
    const result = mapStatisticsFromFeatureCollection(collection);
    expect(result.totalFeatures).toBe(3);
    expect(result.dateRange).toBe("2025-01-10 to 2025-03-15");
  });

  it("uses first feature to detect date columns and collects from all", () => {
    const collection: FeatureCollection = {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          geometry: { type: "Point", coordinates: [0, 0] },
          properties: { date: "2024-12-01" },
        },
        {
          type: "Feature",
          geometry: { type: "Point", coordinates: [1, 1] },
          properties: { date: "2025-06-01" },
        },
      ],
    };
    const result = mapStatisticsFromFeatureCollection(collection);
    expect(result.totalFeatures).toBe(2);
    expect(result.dateRange).toBe("2024-12-01 to 2025-06-01");
  });

  it("ignores features with no date value for range", () => {
    const collection: FeatureCollection = {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          geometry: { type: "Point", coordinates: [0, 0] },
          properties: { updated: "2025-01-01" },
        },
        {
          type: "Feature",
          geometry: { type: "Point", coordinates: [1, 1] },
          properties: {},
        },
      ],
    };
    const result = mapStatisticsFromFeatureCollection(collection);
    expect(result.totalFeatures).toBe(2);
    expect(result.dateRange).toBe("2025-01-01 to 2025-01-01");
  });
});
