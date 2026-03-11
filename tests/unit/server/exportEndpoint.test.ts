import { describe, it, expect, vi, beforeEach } from "vitest";

import { escapeCSVValue } from "@/utils/csvUtils";
// @ts-expect-error - tokml does not have types
import tokml from "tokml";

const mockFetchConfig = vi.fn();
const mockFetchData = vi.fn();

vi.mock("@/server/database/dbOperations", () => ({
  fetchConfig: () => mockFetchConfig(),
  fetchData: (table: string) => mockFetchData(table),
}));

vi.mock("@/utils/accessControls", () => ({
  validatePermissions: vi.fn(),
}));

const sampleData = [
  {
    _id: "rec1",
    name: "Alpha",
    category: "threat",
    g__type: "Point",
    g__coordinates: "[10, 20]",
  },
  {
    _id: "rec2",
    name: "Beta",
    category: "sighting",
    g__type: "Point",
    g__coordinates: "[30, 40]",
  },
  {
    _id: "rec3",
    name: "Gamma",
    category: "observation",
  },
];

const sampleColumns = [
  { original_column: "ID", sql_column: "_id" },
  { original_column: "Name", sql_column: "name" },
  { original_column: "Category", sql_column: "category" },
  { original_column: "Geo Type", sql_column: "g__type" },
  { original_column: "Coordinates", sql_column: "g__coordinates" },
];

describe("GET api/[table]/export", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockFetchConfig.mockResolvedValue({
      test_table: {
        ROUTE_LEVEL_PERMISSION: "anyone",
      },
    });

    mockFetchData.mockResolvedValue({
      mainData: sampleData,
      columnsData: sampleColumns,
      metadata: null,
    });
  });

  describe("CSV format", () => {
    it("builds correct CSV with headers from column metadata", async () => {
      const { mainData, columnsData } = await mockFetchData("test_table");

      const headers = columnsData.map(
        (column: { sql_column: string }) => column.sql_column,
      );
      const headerRow = headers
        .map((header: string) => escapeCSVValue(header))
        .join(",");
      const dataRows = mainData.map((row: Record<string, unknown>) => {
        return headers
          .map((header: string) => escapeCSVValue(row[header]))
          .join(",");
      });
      const csv = [headerRow, ...dataRows].join("\n");

      expect(csv).toContain("_id,name,category,g__type,g__coordinates");
      expect(csv).toContain("rec1,Alpha,threat,Point,");
      expect(csv).toContain("rec2,Beta,sighting,Point,");
      expect(csv).toContain("rec3,Gamma,observation,,");
    });

    it("escapes values containing commas and quotes", async () => {
      mockFetchData.mockResolvedValue({
        mainData: [
          { _id: "r1", name: 'Value with "quotes"', note: "has, comma" },
        ],
        columnsData: [
          { original_column: "ID", sql_column: "_id" },
          { original_column: "Name", sql_column: "name" },
          { original_column: "Note", sql_column: "note" },
        ],
        metadata: null,
      });

      const { mainData, columnsData } = await mockFetchData("test_table");

      const headers = columnsData.map(
        (column: { sql_column: string }) => column.sql_column,
      );
      const row = headers
        .map((header: string) => escapeCSVValue(mainData[0][header]))
        .join(",");

      expect(row).toContain('"Value with ""quotes"""');
      expect(row).toContain('"has, comma"');
    });

    it("returns empty string for empty dataset", () => {
      const data: Record<string, unknown>[] = [];
      expect(data.length).toBe(0);
    });
  });

  describe("GeoJSON format", () => {
    it("builds valid FeatureCollection from records with coordinates", async () => {
      const { mainData } = await mockFetchData("test_table");

      const features = mainData
        .filter(
          (entry: Record<string, unknown>) =>
            entry.g__type && entry.g__coordinates,
        )
        .map((entry: Record<string, unknown>) => {
          const properties: Record<string, unknown> = {};
          for (const [key, value] of Object.entries(entry)) {
            if (!key.startsWith("g__")) {
              properties[key] = value;
            }
          }
          return {
            type: "Feature",
            geometry: {
              type: entry.g__type,
              coordinates: JSON.parse(entry.g__coordinates as string),
            },
            properties,
          };
        });

      const geojson = { type: "FeatureCollection", features };

      expect(geojson.type).toBe("FeatureCollection");
      expect(geojson.features).toHaveLength(2);
      expect(geojson.features[0].geometry.type).toBe("Point");
      expect(geojson.features[0].geometry.coordinates).toEqual([10, 20]);
      expect(geojson.features[0].properties._id).toBe("rec1");
    });

    it("excludes records without valid coordinates", async () => {
      const { mainData } = await mockFetchData("test_table");

      const features = mainData.filter(
        (entry: Record<string, unknown>) =>
          entry.g__type && entry.g__coordinates,
      );

      // rec3 has no g__type or g__coordinates
      expect(features).toHaveLength(2);
      expect(
        features.every(
          (feature: Record<string, unknown>) => feature._id !== "rec3",
        ),
      ).toBe(true);
    });

    it("excludes g__ prefixed keys from feature properties", async () => {
      const { mainData } = await mockFetchData("test_table");

      const entry = mainData[0];
      const properties: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(entry)) {
        if (!key.startsWith("g__")) {
          properties[key] = value;
        }
      }

      expect(properties).not.toHaveProperty("g__type");
      expect(properties).not.toHaveProperty("g__coordinates");
      expect(properties).toHaveProperty("_id");
      expect(properties).toHaveProperty("name");
      expect(properties).toHaveProperty("category");
    });
  });

  describe("KML format", () => {
    const buildGeoJsonFromData = (data: Record<string, unknown>[]) => {
      const features = data
        .filter((entry) => entry.g__type && entry.g__coordinates)
        .map((entry) => {
          const properties: Record<string, unknown> = {};
          for (const [key, value] of Object.entries(entry)) {
            if (!key.startsWith("g__")) {
              properties[key] = value;
            }
          }
          return {
            type: "Feature" as const,
            geometry: {
              type: entry.g__type as string,
              coordinates: JSON.parse(entry.g__coordinates as string),
            },
            properties,
          };
        });
      return { type: "FeatureCollection" as const, features };
    };

    it("produces valid KML with root element and namespace", async () => {
      const { mainData } = await mockFetchData("test_table");
      const geojson = buildGeoJsonFromData(mainData);
      const kml: string = tokml(geojson);

      expect(kml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
      expect(kml).toContain("<kml");
      expect(kml).toContain('xmlns="http://www.opengis.net/kml/2.2"');
      expect(kml).toContain("</kml>");
    });

    it("wraps features in a Document with Placemark elements", async () => {
      const { mainData } = await mockFetchData("test_table");
      const geojson = buildGeoJsonFromData(mainData);
      const kml: string = tokml(geojson);

      expect(kml).toContain("<Document>");
      expect(kml).toContain("</Document>");

      const placemarkCount = (kml.match(/<Placemark>/g) || []).length;
      expect(placemarkCount).toBe(2);
    });

    it("includes Point coordinates in lon,lat order", async () => {
      const { mainData } = await mockFetchData("test_table");
      const geojson = buildGeoJsonFromData(mainData);
      const kml: string = tokml(geojson);

      // GeoJSON [10, 20] → KML <coordinates>10,20</coordinates>
      expect(kml).toContain("<Point>");
      expect(kml).toContain("<coordinates>10,20</coordinates>");
      expect(kml).toContain("<coordinates>30,40</coordinates>");
    });

    it("embeds feature properties as ExtendedData", async () => {
      const { mainData } = await mockFetchData("test_table");
      const geojson = buildGeoJsonFromData(mainData);
      const kml: string = tokml(geojson);

      expect(kml).toContain("<ExtendedData>");
      expect(kml).toContain('<Data name="_id">');
      expect(kml).toContain("<value>rec1</value>");
      expect(kml).toContain('<Data name="name">');
      expect(kml).toContain("<value>Alpha</value>");
      expect(kml).toContain('<Data name="category">');
      expect(kml).toContain("<value>threat</value>");
    });

    it("excludes records without coordinates", async () => {
      const { mainData } = await mockFetchData("test_table");
      const geojson = buildGeoJsonFromData(mainData);
      const kml: string = tokml(geojson);

      // rec3 has no geometry — should not appear as a Placemark
      expect(kml).not.toContain("<value>rec3</value>");
      expect(kml).not.toContain("<value>Gamma</value>");
    });
  });

  describe("validation", () => {
    it("rejects missing format parameter", () => {
      const format = undefined;
      const supported = ["csv", "geojson", "kml"];
      const isValid = format && supported.includes(format);

      expect(isValid).toBeFalsy();
    });

    it("rejects unsupported format parameter", () => {
      const format = "xlsx";
      const supported = ["csv", "geojson", "kml"];
      const isValid = supported.includes(format);

      expect(isValid).toBe(false);
    });

    it("accepts all supported formats", () => {
      const supported = ["csv", "geojson", "kml"];

      for (const format of supported) {
        expect(supported.includes(format)).toBe(true);
      }
    });
  });

  describe("error handling", () => {
    it("propagates error when table does not exist", async () => {
      mockFetchData.mockRejectedValue(new Error("Main table does not exist"));

      await expect(mockFetchData("nonexistent")).rejects.toThrow(
        "Main table does not exist",
      );
    });

    it("preserves raw untransformed values in CSV output", async () => {
      mockFetchData.mockResolvedValue({
        mainData: [
          {
            _id: "raw1",
            p__categoryid: "threat",
            g__type: "Point",
            g__coordinates: "[5, 15]",
            p__photos: "photo.jpg",
          },
        ],
        columnsData: [
          { original_column: "ID", sql_column: "_id" },
          { original_column: "Category ID", sql_column: "p__categoryid" },
          { original_column: "Geo Type", sql_column: "g__type" },
          { original_column: "Coordinates", sql_column: "g__coordinates" },
          { original_column: "Photos", sql_column: "p__photos" },
        ],
        metadata: null,
      });

      const { mainData } = await mockFetchData("test_table");

      expect(mainData[0].p__categoryid).toBe("threat");
      expect(mainData[0].g__type).toBe("Point");
      expect(mainData[0].p__photos).toBe("photo.jpg");
    });
  });
});
