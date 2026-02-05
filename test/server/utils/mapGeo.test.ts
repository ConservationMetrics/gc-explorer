import { describe, it, expect } from "vitest";
import {
  isValidGeoRow,
  getFilterColorForValue,
  filterOutUnwantedValues,
  buildMapFeatureCollection,
} from "@/server/utils/mapGeo";

describe("isValidGeoRow", () => {
  it("returns true for valid Point row", () => {
    expect(
      isValidGeoRow({
        _id: "1",
        g__type: "Point",
        g__coordinates: "[10, 20]",
      }),
    ).toBe(true);
  });

  it("returns true for valid LineString row", () => {
    expect(
      isValidGeoRow({
        _id: "2",
        g__type: "LineString",
        g__coordinates: "[[0,0],[1,1]]",
      }),
    ).toBe(true);
  });

  it("returns false when g__type is missing", () => {
    expect(
      isValidGeoRow({
        _id: "1",
        g__coordinates: "[10, 20]",
      }),
    ).toBe(false);
  });

  it("returns false when g__coordinates is missing", () => {
    expect(
      isValidGeoRow({
        _id: "1",
        g__type: "Point",
      }),
    ).toBe(false);
  });

  it("returns false for invalid Point coordinates", () => {
    expect(
      isValidGeoRow({
        _id: "1",
        g__type: "Point",
        g__coordinates: "[not, valid]",
      }),
    ).toBe(false);
  });

  it("returns false for unsupported geometry type", () => {
    expect(
      isValidGeoRow({
        _id: "1",
        g__type: "Unknown",
        g__coordinates: "[10, 20]",
      }),
    ).toBe(false);
  });
});

describe("getFilterColorForValue", () => {
  it("returns default color for empty string", () => {
    const color = getFilterColorForValue("");
    expect(color).toMatch(/^#[0-9A-Fa-f]{6}$/);
    expect(color).toBe("#3333FF");
  });

  it("returns deterministic color for same value", () => {
    const a = getFilterColorForValue("community-A");
    const b = getFilterColorForValue("community-A");
    expect(a).toBe(b);
  });

  it("returns hex color for any string", () => {
    const color = getFilterColorForValue("any-value");
    expect(color).toMatch(/^#[0-9A-Fa-f]{6}$/);
  });
});

describe("filterOutUnwantedValues", () => {
  it("returns all rows when filterByColumn or filterOutValues is missing", () => {
    const rows = [{ _id: "1", type: "A" }, { _id: "2", type: "B" }];
    expect(filterOutUnwantedValues(rows, undefined, "x")).toBe(rows);
    expect(filterOutUnwantedValues(rows, "type", undefined)).toBe(rows);
  });

  it("filters out rows whose column value is in the list", () => {
    const rows = [
      { _id: "1", kind: "keep" },
      { _id: "2", kind: "remove" },
      { _id: "3", kind: "keep" },
    ];
    const result = filterOutUnwantedValues(rows, "kind", "remove");
    expect(result).toHaveLength(2);
    expect(result.map((r) => r._id)).toEqual(["1", "3"]);
  });

  it("handles comma-separated filter-out values", () => {
    const rows = [
      { _id: "1", kind: "a" },
      { _id: "2", kind: "b" },
      { _id: "3", kind: "c" },
    ];
    const result = filterOutUnwantedValues(rows, "kind", "a, c");
    expect(result).toHaveLength(1);
    expect(result[0]._id).toBe("2");
  });
});

describe("buildMapFeatureCollection", () => {
  const minimalConfig = {
    FRONT_END_FILTER_COLUMN: "category",
  };

  it("returns valid FeatureCollection with flat properties", () => {
    const rows = [
      {
        _id: "id-1",
        g__type: "Point",
        g__coordinates: "[1, 2]",
        category: "A",
      },
    ];
    const fc = buildMapFeatureCollection(rows, minimalConfig as any);
    expect(fc.type).toBe("FeatureCollection");
    expect(fc.features).toHaveLength(1);
    const f = fc.features[0];
    expect(f.type).toBe("Feature");
    expect(f.geometry.type).toBe("Point");
    expect(f.geometry.coordinates).toEqual([1, 2]);
    expect(f.properties).toEqual({
      _id: "id-1",
      "filter-color": expect.stringMatching(/^#[0-9A-Fa-f]{6}$/),
      category: "A",
    });
    expect(f.id).toBe("id-1");
  });

  it("includes COLOR_COLUMN and ICON_COLUMN when set in config", () => {
    const rows = [
      {
        _id: "id-1",
        g__type: "Point",
        g__coordinates: "[0, 0]",
        color: "red",
        icon: "pin.png",
      },
    ];
    const config = {
      ...minimalConfig,
      COLOR_COLUMN: "color",
      ICON_COLUMN: "icon",
    };
    const fc = buildMapFeatureCollection(rows, config as any);
    const p = fc.features[0].properties!;
    expect(p.color).toBe("red");
    expect(p.icon).toBe("pin.png");
  });

  it("returns empty features array for empty rows", () => {
    const fc = buildMapFeatureCollection([], minimalConfig as any);
    expect(fc.type).toBe("FeatureCollection");
    expect(fc.features).toHaveLength(0);
  });
});
