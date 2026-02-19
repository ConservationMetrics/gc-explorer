import { describe, it, expect } from "vitest";
import { buildMinimalFeatureCollection } from "@/server/utils/formatSpatialData";

describe("buildMinimalFeatureCollection", () => {
  const sampleData = [
    {
      _id: "rec-1",
      g__type: "Point",
      g__coordinates: "[10.5, 45.2]",
      name: "Alpha",
      category: "park",
      color: "#FF0000",
    },
    {
      _id: "rec-2",
      g__type: "Point",
      g__coordinates: "[11.0, 46.0]",
      name: "Beta",
      category: "forest",
      color: "#00FF00",
    },
    {
      _id: "rec-3",
      g__type: "Point",
      g__coordinates: "invalid-json",
      name: "Gamma",
      category: "lake",
    },
    {
      _id: "rec-4",
      g__type: "Point",
      g__coordinates: "",
      name: "Delta",
    },
  ];

  it("returns a valid GeoJSON FeatureCollection", () => {
    const result = buildMinimalFeatureCollection(sampleData);

    expect(result.type).toBe("FeatureCollection");
    expect(Array.isArray(result.features)).toBe(true);
  });

  it("skips entries with invalid or missing coordinates", () => {
    const result = buildMinimalFeatureCollection(sampleData);

    expect(result.features).toHaveLength(2);
    const ids = result.features.map((f) => f.properties?._id);
    expect(ids).toContain("rec-1");
    expect(ids).toContain("rec-2");
    expect(ids).not.toContain("rec-3");
    expect(ids).not.toContain("rec-4");
  });

  it("assigns a numeric feature ID via murmurhash by default", () => {
    const result = buildMinimalFeatureCollection(sampleData);

    result.features.forEach((f) => {
      expect(typeof f.id).toBe("number");
    });
  });

  it("includes only requested properties", () => {
    const result = buildMinimalFeatureCollection(sampleData, {
      includeProperties: ["color"],
    });

    const firstFeature = result.features[0];
    expect(firstFeature.properties).toHaveProperty("_id");
    expect(firstFeature.properties).toHaveProperty("color");
    expect(firstFeature.properties).not.toHaveProperty("name");
    expect(firstFeature.properties).not.toHaveProperty("category");
  });

  it("includes all non-geo properties when includeAllProperties is true", () => {
    const result = buildMinimalFeatureCollection(sampleData, {
      includeAllProperties: true,
    });

    const firstFeature = result.features[0];
    expect(firstFeature.properties).toHaveProperty("_id");
    expect(firstFeature.properties).toHaveProperty("name");
    expect(firstFeature.properties).toHaveProperty("category");
    expect(firstFeature.properties).toHaveProperty("color");
    expect(firstFeature.properties).not.toHaveProperty("g__type");
    expect(firstFeature.properties).not.toHaveProperty("g__coordinates");
  });

  it("assigns deterministic filter-color per unique filterColumn value", () => {
    const result = buildMinimalFeatureCollection(sampleData, {
      filterColumn: "category",
    });

    result.features.forEach((f) => {
      expect(f.properties).toHaveProperty("filter-color");
      expect(f.properties).toHaveProperty("category");
    });

    const colors = result.features.map((f) => f.properties?.["filter-color"]);
    expect(colors[0]).not.toBe(colors[1]);
  });

  it("preserves null for entries missing a filter column value", () => {
    const dataWithMissingFilter = [
      {
        _id: "rec-1",
        g__type: "Point",
        g__coordinates: "[10.5, 45.2]",
        category: "park",
      },
      {
        _id: "rec-2",
        g__type: "Point",
        g__coordinates: "[11.0, 46.0]",
      },
    ];

    const result = buildMinimalFeatureCollection(dataWithMissingFilter, {
      filterColumn: "category",
    });

    expect(result.features[0].properties?.category).toBe("park");
    expect(result.features[1].properties?.category).toBeNull();
    expect(result.features[1].properties?.["filter-color"]).toBe("#3333FF");
  });

  it("omits empty/null includeProperties so Mapbox coalesce falls through", () => {
    const dataWithEmptyColor = [
      {
        _id: "rec-1",
        g__type: "Point",
        g__coordinates: "[10.5, 45.2]",
        color: "#FF0000",
      },
      {
        _id: "rec-2",
        g__type: "Point",
        g__coordinates: "[11.0, 46.0]",
        color: "",
      },
      {
        _id: "rec-3",
        g__type: "Point",
        g__coordinates: "[12.0, 47.0]",
        color: null,
      },
    ];

    const result = buildMinimalFeatureCollection(dataWithEmptyColor, {
      includeProperties: ["color"],
    });

    expect(result.features[0].properties?.color).toBe("#FF0000");
    expect(result.features[1].properties).not.toHaveProperty("color");
    expect(result.features[2].properties).not.toHaveProperty("color");
  });

  it("uses custom generateId when provided", () => {
    const result = buildMinimalFeatureCollection(sampleData, {
      generateId: (entry) => Number(entry._id.replace("rec-", "")) * 100,
    });

    expect(result.features[0].id).toBe(100);
    expect(result.features[1].id).toBe(200);
  });

  it("normalizes Mapeo hex IDs to 32-bit integers when isMapeoData is true", () => {
    const mapeoData = [
      {
        _id: "0084cdc57c0b0280",
        g__type: "Point",
        g__coordinates: "[10.5, 45.2]",
        name: "Mapeo observation",
      },
      {
        id: "00a1b2c3d4e5f678",
        g__type: "Point",
        g__coordinates: "[11.0, 46.0]",
        name: "Mapeo observation (id field)",
      },
    ];

    const result = buildMinimalFeatureCollection(mapeoData, {
      isMapeoData: true,
    });

    expect(result.features).toHaveLength(2);
    result.features.forEach((feature) => {
      expect(typeof feature.id).toBe("number");
      expect(Number.isInteger(feature.id)).toBe(true);
    });
  });

  it("skips Mapeo ID normalization for non-hex IDs", () => {
    const nonHexData = [
      {
        _id: "not-a-hex-id",
        g__type: "Point",
        g__coordinates: "[10.5, 45.2]",
      },
    ];

    const result = buildMinimalFeatureCollection(nonHexData, {
      isMapeoData: true,
    });

    expect(result.features).toHaveLength(1);
    expect(result.features[0].id).toBeUndefined();
  });

  it("uses custom idField", () => {
    const dataWithCustomId = [
      {
        docId: "doc-1",
        g__type: "Point",
        g__coordinates: "[5, 5]",
      },
    ];

    const result = buildMinimalFeatureCollection(dataWithCustomId, {
      idField: "docId",
    });

    expect(result.features[0].properties?.docId).toBe("doc-1");
  });

  it("returns empty FeatureCollection for empty input", () => {
    const result = buildMinimalFeatureCollection([]);
    expect(result.type).toBe("FeatureCollection");
    expect(result.features).toHaveLength(0);
  });
});
