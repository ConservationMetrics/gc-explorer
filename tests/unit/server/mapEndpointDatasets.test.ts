import { beforeEach, describe, expect, it, vi } from "vitest";

const mockFetchViewDatasets = vi.fn();
const mockFetchTableConfig = vi.fn();
const mockFetchTableSqlColumns = vi.fn();
const mockFetchData = vi.fn();
const mockValidatePermissions = vi.fn();

vi.mock("@/server/database/dbOperations", () => ({
  fetchViewDatasets: (table: string, viewType: string) =>
    mockFetchViewDatasets(table, viewType),
  fetchTableConfig: (table: string) => mockFetchTableConfig(table),
  fetchTableSqlColumns: (table: string) => mockFetchTableSqlColumns(table),
  fetchData: (table: string, options: unknown) => mockFetchData(table, options),
}));

vi.mock("@/utils/accessControls", () => ({
  validatePermissions: (event: unknown, permission?: string) =>
    mockValidatePermissions(event, permission),
}));

vi.mock("@/server/utils/dbHelpers", () => ({
  parseAndValidateLimit: () => 50,
}));

vi.mock("@/server/utils", () => ({
  parseBasemaps: () => ({
    basemaps: [],
    defaultMapboxStyle: "mapbox://styles/mapbox/streets-v12",
  }),
}));

vi.mock("@/server/dataProcessing/dataFilters", () => ({
  filterOutUnwantedValues: (rows: unknown[]) => rows,
  filterGeoData: (rows: unknown[]) => rows,
}));

vi.mock("@/server/dataProcessing/dataTransformers", () => ({
  prepareMapStatistics: () => ({ pointsTotal: 0 }),
}));

vi.mock("@/utils/geoUtils", () => ({
  buildMinimalFeatureCollection: () => ({
    type: "FeatureCollection",
    features: [],
  }),
}));

vi.stubGlobal("defineEventHandler", (handler: unknown) => handler);
vi.stubGlobal("useRuntimeConfig", () => ({
  public: {
    allowedFileExtensions: { image: [], audio: [], video: [] },
  },
}));

describe("map endpoint dataset config", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockFetchViewDatasets.mockResolvedValue({
      primaryDataset: "bcmform_responses",
      secondaryDatasets: [],
    });

    mockFetchTableConfig.mockResolvedValue({
      ROUTE_LEVEL_PERMISSION: "member",
      FILTER_BY_COLUMN: undefined,
      FILTER_OUT_VALUES_FROM_COLUMN: undefined,
      COLOR_COLUMN: undefined,
      ICON_COLUMN: undefined,
      FRONT_END_FILTER_COLUMN: undefined,
      TIMESTAMP_COLUMN: "p__created",
      MAP_LEGEND_LAYER_IDS: "",
      MAPBOX_3D: false,
      MAPBOX_3D_TERRAIN_EXAGGERATION: 1,
      MAPBOX_ACCESS_TOKEN: "token",
      MAPBOX_BEARING: 0,
      MAPBOX_CENTER_LATITUDE: "0",
      MAPBOX_CENTER_LONGITUDE: "0",
      MAPBOX_PITCH: 0,
      MAPBOX_PROJECTION: "globe",
      MAPBOX_ZOOM: 7,
      MEDIA_BASE_PATH: "",
      MEDIA_BASE_PATH_ICONS: "",
      MEDIA_COLUMN: "",
      PLANET_API_KEY: "",
    });

    mockFetchData.mockResolvedValue({
      mainData: [{ _id: "abc" }],
      columnsData: null,
      metadata: null,
    });

    mockFetchTableSqlColumns.mockResolvedValue([
      "_id",
      "g__type",
      "g__coordinates",
      "p__created",
    ]);
  });

  it("reads map datasets from view_config_map and exposes structured fields", async () => {
    const { default: handler } = await import("@/server/api/[table]/map");
    const response = (await handler({
      context: { params: { table: "bcmform_responses" } },
    } as never)) as Record<string, unknown>;

    expect(mockFetchViewDatasets).toHaveBeenCalledWith(
      "bcmform_responses",
      "map",
    );
    expect(mockFetchData).toHaveBeenCalledWith(
      "bcmform_responses",
      expect.objectContaining({
        limit: 50,
        mainColumns: expect.arrayContaining([
          "_id",
          "g__type",
          "g__coordinates",
          "p__created",
        ]),
      }),
    );
    expect(response["primary_dataset"]).toBe("bcmform_responses");
    expect(response["secondary_datasets"]).toEqual([]);
  });
});
