import { beforeEach, describe, expect, it, vi } from "vitest";

import mapHandler from "@/server/api/[table]/map";
import { VIEW_CONFIG_MISSING_COLUMNS_ERROR } from "@/types";

type MapRouteEvent = {
  context: { params: { table: string } };
};

type MapRouteResponse = Record<string, unknown>;

type MapRouteHandler = (event: MapRouteEvent) => Promise<MapRouteResponse>;

const handleMapRequest = mapHandler as unknown as MapRouteHandler;

const hoisted = vi.hoisted(() => {
  Object.assign(globalThis, {
    defineEventHandler: (handler: unknown) => handler,
    sendError: (_event: unknown, error: unknown) => error,
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
    fetchInformationSchemaColumns: vi.fn(),
    fetchTableConfig: vi.fn(),
    fetchTableSqlColumns: vi.fn(),
    fetchViewTables: vi.fn(),
    filterGeoData: vi.fn(),
    parseAndValidateLimit: vi.fn(),
    parseBasemaps: vi.fn(),
    prepareMapStatistics: vi.fn(),
    validatePermissions: vi.fn(),
  };
});

vi.mock("@/server/database/dbOperations", () => ({
  fetchData: hoisted.fetchData,
  fetchInformationSchemaColumns: hoisted.fetchInformationSchemaColumns,
  fetchTableConfig: hoisted.fetchTableConfig,
  fetchTableSqlColumns: hoisted.fetchTableSqlColumns,
  fetchViewTables: hoisted.fetchViewTables,
}));

vi.mock("@/server/dataProcessing/dataFilters", () => ({
  filterGeoData: hoisted.filterGeoData,
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
  getTableParam: (event: MapRouteEvent) => {
    const table = event.context.params.table;
    try {
      return decodeURIComponent(table.replace(/"/g, ""));
    } catch {
      return table.replace(/"/g, "");
    }
  },
}));

describe("map endpoint datasets", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    hoisted.parseAndValidateLimit.mockReturnValue(25);
    hoisted.fetchTableConfig.mockResolvedValue({
      COLOR_COLUMN: "status",
      FRONT_END_FILTER_COLUMN: "category",
      ROUTE_LEVEL_PERMISSION: "anyone",
      DATASET_TABLE: "Friendly Map Name",
      VIEW_DESCRIPTION: "A map of interesting places.",
      LOGO_URL: "https://example.com/logo.png",
    });
    hoisted.fetchViewTables.mockResolvedValue({
      primaryTable: "map_dataset",
      secondaryTable: null,
    });
    hoisted.fetchInformationSchemaColumns.mockResolvedValue([
      "_id",
      "g__type",
      "g__coordinates",
      "status",
      "category",
      "created_at",
    ]);
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
    expect(hoisted.fetchInformationSchemaColumns).toHaveBeenCalledWith(
      "map_dataset",
    );
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
    expect(response.viewName).toBe("Friendly Map Name");
    expect(response.viewDescription).toBe("A map of interesting places.");
    expect(response.logoUrl).toBe("https://example.com/logo.png");
    expect(response.data).toEqual({ type: "FeatureCollection", features: [] });
  });

  it("decodes percent-encoded Thai table names before config/warehouse lookups", async () => {
    const thaiTable = "แม่ยางมิ้น_observations";
    const encodedTable = encodeURIComponent(thaiTable);

    hoisted.fetchViewTables.mockResolvedValue({
      primaryTable: thaiTable,
      secondaryTable: null,
    });

    await handleMapRequest({
      context: { params: { table: encodedTable } },
    });

    expect(hoisted.fetchTableConfig).toHaveBeenCalledWith(thaiTable, "map");
    expect(hoisted.fetchViewTables).toHaveBeenCalledWith(thaiTable, "map");
    expect(hoisted.fetchTableSqlColumns).toHaveBeenCalledWith(thaiTable);
    expect(hoisted.fetchData).toHaveBeenCalledWith(
      thaiTable,
      expect.objectContaining({ limit: 25 }),
    );
  });

  it("returns 422 when a configured column is missing", async () => {
    hoisted.fetchTableConfig.mockResolvedValue({
      COLOR_COLUMN: "missing_color",
      FRONT_END_FILTER_COLUMN: "category",
      ROUTE_LEVEL_PERMISSION: "anyone",
    });
    hoisted.fetchInformationSchemaColumns.mockResolvedValue([
      "_id",
      "g__type",
      "g__coordinates",
      "category",
    ]);

    const response = await handleMapRequest({
      context: { params: { table: "route_map" } },
    });

    expect(response).toMatchObject({
      statusCode: 422,
      data: {
        errorCode: VIEW_CONFIG_MISSING_COLUMNS_ERROR,
        table: "map_dataset",
        missing: [{ field: "COLOR_COLUMN", column: "missing_color" }],
      },
    });
    expect(hoisted.fetchData).not.toHaveBeenCalled();
  });

  it("reports every missing configured column in one 422", async () => {
    hoisted.fetchTableConfig.mockResolvedValue({
      COLOR_COLUMN: "missing_color",
      ICON_COLUMN: "missing_icon",
      FRONT_END_FILTER_COLUMN: "category",
      ROUTE_LEVEL_PERMISSION: "anyone",
    });
    hoisted.fetchInformationSchemaColumns.mockResolvedValue([
      "_id",
      "g__type",
      "g__coordinates",
      "category",
    ]);

    const response = await handleMapRequest({
      context: { params: { table: "route_map" } },
    });

    expect(response).toMatchObject({
      statusCode: 422,
      data: {
        errorCode: VIEW_CONFIG_MISSING_COLUMNS_ERROR,
        table: "map_dataset",
        missing: [
          { field: "COLOR_COLUMN", column: "missing_color" },
          { field: "ICON_COLUMN", column: "missing_icon" },
        ],
      },
    });
    expect(hoisted.fetchData).not.toHaveBeenCalled();
  });

  it("loads the map when optional configured columns are unset", async () => {
    hoisted.fetchTableConfig.mockResolvedValue({
      ROUTE_LEVEL_PERMISSION: "anyone",
    });

    const response = await handleMapRequest({
      context: { params: { table: "route_map" } },
    });

    expect(hoisted.fetchInformationSchemaColumns).not.toHaveBeenCalled();
    expect(hoisted.fetchData).toHaveBeenCalled();
    expect(response.data).toEqual({ type: "FeatureCollection", features: [] });
  });
});
