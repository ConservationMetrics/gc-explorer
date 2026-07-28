import { beforeEach, describe, expect, it, vi } from "vitest";

import mapHandler from "@/server/api/[table]/map";

type MapRouteEvent = {
  context: { params: { table: string } };
};

type MapRouteResponse = Record<string, unknown>;

type MapRouteHandler = (event: MapRouteEvent) => Promise<MapRouteResponse>;

const handleMapRequest = mapHandler as unknown as MapRouteHandler;

const hoisted = vi.hoisted(() => {
  Object.assign(globalThis, {
    defineEventHandler: (handler: unknown) => handler,
    useRuntimeConfig: () => ({
      public: {
        allowedFileExtensions: {
          audio: [],
          image: ["jpg"],
          video: [],
        },
      },
    }),
  });

  return {
    buildMinimalFeatureCollection: vi.fn(),
    fetchData: vi.fn(),
    fetchTableConfig: vi.fn(),
    fetchTableSqlColumns: vi.fn(),
    fetchViewTables: vi.fn(),
    filterGeoData: vi.fn(),
    filterOutUnwantedValues: vi.fn(),
    parseAndValidateLimit: vi.fn(),
    parseBasemaps: vi.fn(),
    prepareMapStatistics: vi.fn(),
    validatePermissions: vi.fn(),
  };
});

vi.mock("@/server/database/dbOperations", () => ({
  fetchData: hoisted.fetchData,
  fetchTableConfig: hoisted.fetchTableConfig,
  fetchTableSqlColumns: hoisted.fetchTableSqlColumns,
  fetchViewTables: hoisted.fetchViewTables,
}));

vi.mock("@/server/dataProcessing/dataFilters", () => ({
  filterGeoData: hoisted.filterGeoData,
  filterOutUnwantedValues: hoisted.filterOutUnwantedValues,
}));

vi.mock("@/server/dataProcessing/dataTransformers", () => ({
  prepareMapStatistics: hoisted.prepareMapStatistics,
}));

vi.mock("@/utils/geoUtils", () => ({
  buildMinimalFeatureCollection: hoisted.buildMinimalFeatureCollection,
}));

vi.mock("@/utils/accessControls", () => ({
  validatePermissions: hoisted.validatePermissions,
}));

vi.mock("@/server/utils", () => ({
  parseBasemaps: hoisted.parseBasemaps,
}));

vi.mock("@/server/utils/dbHelpers", () => ({
  parseAndValidateLimit: hoisted.parseAndValidateLimit,
}));

describe("map endpoint datasets", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    hoisted.parseAndValidateLimit.mockReturnValue(25);
    hoisted.fetchTableConfig.mockResolvedValue({
      COLOR_COLUMN: "status",
      FRONT_END_FILTER_COLUMN: "category",
      ROUTE_LEVEL_PERMISSION: "anyone",
    });
    hoisted.fetchViewTables.mockResolvedValue({
      primaryTable: "map_dataset",
      secondaryTable: null,
    });
    hoisted.fetchTableSqlColumns.mockResolvedValue([
      "_id",
      "g__type",
      "g__coordinates",
      "status",
      "category",
      "created_at",
    ]);
    hoisted.fetchData.mockResolvedValue({
      mainData: [
        {
          _id: "record-1",
          g__type: "Point",
          g__coordinates: "[0,0]",
          status: "open",
          category: "test",
          created_at: "2026-01-01",
        },
      ],
      columnsData: null,
      metadata: null,
    });
    hoisted.filterOutUnwantedValues.mockImplementation((data) => data);
    hoisted.filterGeoData.mockImplementation((data) => data);
    hoisted.buildMinimalFeatureCollection.mockReturnValue({
      type: "FeatureCollection",
      features: [],
    });
    hoisted.prepareMapStatistics.mockReturnValue({ totalFeatures: 1 });
    hoisted.parseBasemaps.mockReturnValue({
      basemaps: [],
      defaultMapboxStyle: "mapbox://styles/mapbox/streets-v12",
    });
  });

  it("fetches map data from the typed primary dataset and returns it", async () => {
    const response = await handleMapRequest({
      context: { params: { table: "route_map" } },
    });

    expect(hoisted.fetchTableConfig).toHaveBeenCalledWith("route_map", "map");
    expect(hoisted.fetchViewTables).toHaveBeenCalledWith("route_map", "map");
    expect(hoisted.fetchTableSqlColumns).toHaveBeenCalledWith("map_dataset");
    expect(hoisted.fetchData).toHaveBeenCalledWith("map_dataset", {
      limit: 25,
      mainColumns: [
        "_id",
        "g__type",
        "g__coordinates",
        "status",
        "category",
        "created_at",
      ],
    });
    expect(response.primary_dataset).toBe("map_dataset");
    expect(response.table).toBe("map_dataset");
    expect(response.data).toEqual({ type: "FeatureCollection", features: [] });
  });
});
