import "./setupGlobals";
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.stubGlobal("useRuntimeConfig", () => ({
  public: { allowedFileExtensions: { audio: [], image: [], video: [] } },
}));

vi.mock("@/server/database/dbOperations", () => ({
  fetchConfig: vi.fn(),
  fetchMapData: vi.fn(),
}));

vi.mock("@/utils/auth", () => ({
  validatePermissions: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/server/utils/basemaps", () => ({
  parseBasemaps: vi.fn().mockReturnValue({
    basemaps: [],
    defaultMapboxStyle: "mapbox://styles/mapbox/streets-v12",
  }),
}));

import mapHandler from "@/server/api/[table]/map";
import * as dbOperations from "@/server/database/dbOperations";

/**
 * Minimal table config for map endpoint (matches CI seed in dbOperations).
 */
const tableConfig = {
  FRONT_END_FILTER_COLUMN: "community",
  MAPBOX_STYLE: "mapbox://styles/mapbox/streets-v12",
  MAPBOX_ACCESS_TOKEN: "pk.test",
  MAPBOX_ZOOM: 16,
  MAPBOX_CENTER_LATITUDE: "3.44704",
  MAPBOX_CENTER_LONGITUDE: "-76.53995",
  MAPBOX_PROJECTION: "globe",
  MAPBOX_BEARING: 0,
  MAPBOX_PITCH: 0,
  MAPBOX_3D: false,
  MAPBOX_3D_TERRAIN_EXAGGERATION: 0,
  ROUTE_LEVEL_PERMISSION: "anyone" as const,
};

/**
 * Creates a minimal H3-like event with context.params for the map handler.
 */
function createMockEvent(table: string) {
  return {
    context: { params: { table } },
    node: { req: {}, res: {} },
  } as unknown as Parameters<typeof mapHandler>[0];
}

describe("GET api/[table]/map", () => {
  beforeEach(() => {
    vi.mocked(dbOperations.fetchConfig).mockResolvedValue({
      seed_survey_data: tableConfig,
    });
    vi.mocked(dbOperations.fetchMapData).mockResolvedValue({
      mapRows: [
        {
          _id: "id-1",
          g__type: "Point",
          g__coordinates: "[-76.5, 3.44]",
          community: "A",
        },
        {
          _id: "id-2",
          g__type: "Point",
          g__coordinates: "[-76.6, 3.45]",
          community: "B",
        },
      ],
      columnsData: null,
      resolvedColumns: {
        colorColumn: null,
        iconColumn: null,
        filterColumn: "community",
        filterByColumn: null,
      },
    });
  });

  it("returns 200 and a GeoJSON FeatureCollection with minimal map fields", async () => {
    const event = createMockEvent("seed_survey_data");
    const response = await mapHandler(event);

    expect(response).toBeDefined();
    expect(response).toHaveProperty("data");
    const data = (response as { data: unknown }).data;
    expect(data).toHaveProperty("type", "FeatureCollection");
    expect(data).toHaveProperty("features");
    const features = (data as { features: unknown[] }).features;
    expect(Array.isArray(features)).toBe(true);
    expect(features.length).toBe(2);

    for (const f of features) {
      const feature = f as {
        id?: unknown;
        geometry?: unknown;
        properties?: Record<string, unknown>;
      };
      expect(feature).toHaveProperty("id");
      expect(feature).toHaveProperty("geometry");
      expect(feature.geometry).toHaveProperty("type");
      expect(feature.geometry).toHaveProperty("coordinates");
      expect(feature).toHaveProperty("properties");
      expect(feature.properties).toHaveProperty("_id");
      expect(feature.properties).toHaveProperty("filter-color");
    }
  });

  it("returns 404 when table config is missing", async () => {
    vi.mocked(dbOperations.fetchConfig).mockResolvedValue({});
    const event = createMockEvent("nonexistent_table");

    await expect(mapHandler(event)).rejects.toThrow("Table config not found");
  });

  it("calls fetchMapData with table and config (no full fetch)", async () => {
    const event = createMockEvent("seed_survey_data");
    await mapHandler(event);

    expect(dbOperations.fetchConfig).toHaveBeenCalled();
    expect(dbOperations.fetchMapData).toHaveBeenCalledWith(
      "seed_survey_data",
      tableConfig,
    );
  });
});
