import { beforeEach, describe, expect, it, vi } from "vitest";

const mockFetchViewDatasets = vi.fn();
const mockFetchTableConfig = vi.fn();
const mockFetchTableSqlColumns = vi.fn();
const mockFetchViewDatasetData = vi.fn();
const mockValidatePermissions = vi.fn();

vi.mock("@/server/database/dbOperations", () => ({
  ALERTS_METADATA_PROJECTION: [
    "data_source",
    "type_alert",
    "month",
    "year",
    "day",
    "total_alerts",
    "description_alerts",
    "territory",
  ],
  fetchViewDatasets: (table: string, viewType: string) =>
    mockFetchViewDatasets(table, viewType),
  fetchTableConfig: (table: string) => mockFetchTableConfig(table),
  fetchTableSqlColumns: (table: string) => mockFetchTableSqlColumns(table),
  fetchViewDatasetData: (
    primaryDataset: string,
    options: {
      secondaryDataset?: string | null;
      primaryOptions: { limit?: number; mainColumns: string[] };
      secondaryOptions?: {
        mainColumns: string[];
        includeColumnsData?: boolean;
      };
    },
  ) => mockFetchViewDatasetData(primaryDataset, options),
}));

vi.mock("@/utils/accessControls", () => ({
  validatePermissions: (event: unknown, permission?: string) =>
    mockValidatePermissions(event, permission),
}));

vi.mock("@/server/utils", () => ({
  parseBasemaps: () => ({
    basemaps: [],
    defaultMapboxStyle: "mapbox://styles/mapbox/streets-v12",
  }),
}));

vi.mock("@/server/utils/dbHelpers", () => ({
  parseAndValidateLimit: () => 100,
}));

vi.mock("@/server/dataProcessing/dataTransformers", () => ({
  prepareMinimalAlertEntries: (mainData: unknown[]) => ({
    mostRecentAlerts: mainData,
    previousAlerts: [],
  }),
  prepareAlertsStatistics: () => ({ alertsTotal: 0 }),
}));

vi.mock("@/server/dataProcessing/dataFilters", () => ({
  filterUnwantedKeys: (rows: unknown[]) => rows,
  filterGeoData: (rows: unknown[]) => rows,
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

describe("alerts endpoint dataset config", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockFetchViewDatasets.mockResolvedValue({
      primaryDataset: "alerts_confidential",
      secondaryDatasets: ["mapeo_data"],
    });

    mockFetchTableConfig.mockResolvedValue({
      ROUTE_LEVEL_PERMISSION: "anyone",
      MAPEO_CATEGORY_IDS: "threat",
      MAPBOX_3D: false,
      MAPBOX_ZOOM: 7,
      MAPBOX_BEARING: 0,
      MAPBOX_CENTER_LATITUDE: "0",
      MAPBOX_CENTER_LONGITUDE: "0",
      MAPBOX_PITCH: 0,
      MAPBOX_PROJECTION: "globe",
      MAPBOX_ACCESS_TOKEN: "token",
      MAPBOX_STYLE: "mapbox://styles/mapbox/streets-v12",
      MEDIA_BASE_PATH: "",
      MEDIA_BASE_PATH_ALERTS: "",
      PLANET_API_KEY: "",
    });

    mockFetchTableSqlColumns.mockImplementation((table: string) => {
      if (table === "alerts_confidential") {
        return Promise.resolve([
          "_id",
          "alert_id",
          "month_detec",
          "year_detec",
          "g__type",
          "g__coordinates",
          "alert_type",
        ]);
      }
      if (table === "alerts_confidential__metadata") {
        return Promise.resolve(["data_source", "year", "month", "territory"]);
      }
      if (table === "mapeo_data") {
        return Promise.resolve([
          "_id",
          "category",
          "g__type",
          "g__coordinates",
        ]);
      }
      return Promise.resolve([]);
    });

    mockFetchViewDatasetData.mockResolvedValue({
      primaryData: {
        mainData: [{ _id: "1", alertID: "a1" }],
        columnsData: null,
        metadata: [],
      },
      secondaryData: {
        mainData: [],
        columnsData: [],
        metadata: null,
      },
    });
  });

  it("reads alerts datasets from views and exposes structured fields", async () => {
    const { default: handler } = await import("@/server/api/[table]/alerts");
    const response = (await handler({
      context: { params: { table: "alerts_confidential" } },
    } as never)) as Record<string, unknown>;

    expect(mockFetchViewDatasets).toHaveBeenCalledWith(
      "alerts_confidential",
      "alert",
    );
    expect(mockFetchViewDatasetData).toHaveBeenCalledWith(
      "alerts_confidential",
      expect.objectContaining({
        secondaryDataset: "mapeo_data",
        primaryOptions: expect.objectContaining({
          limit: 100,
          mainColumns: expect.arrayContaining([
            "_id",
            "alert_id",
            "month_detec",
            "year_detec",
            "g__type",
            "g__coordinates",
          ]),
        }),
        secondaryOptions: expect.objectContaining({
          mainColumns: expect.arrayContaining(["_id", "category"]),
          includeColumnsData: true,
        }),
      }),
    );
    expect(response["primary_dataset"]).toBe("alerts_confidential");
    expect(response["secondary_dataset"]).toBe("mapeo_data");
  });

  it("handles alerts views without a secondary Mapeo dataset", async () => {
    mockFetchViewDatasets.mockResolvedValueOnce({
      primaryDataset: "alerts_confidential",
      secondaryDatasets: [],
    });
    mockFetchViewDatasetData.mockResolvedValueOnce({
      primaryData: {
        mainData: [{ _id: "1", alertID: "a1" }],
        columnsData: null,
        metadata: [],
      },
      secondaryData: null,
    });

    const { default: handler } = await import("@/server/api/[table]/alerts");
    const response = (await handler({
      context: { params: { table: "alerts_confidential" } },
    } as never)) as Record<string, unknown>;

    expect(mockFetchViewDatasetData).toHaveBeenCalledWith(
      "alerts_confidential",
      expect.objectContaining({
        secondaryDataset: null,
        primaryOptions: expect.objectContaining({
          limit: 100,
        }),
        secondaryOptions: undefined,
      }),
    );
    expect(mockFetchTableSqlColumns).not.toHaveBeenCalledWith("mapeo_data");
    expect(response["primary_dataset"]).toBe("alerts_confidential");
    expect(response["secondary_dataset"]).toBeNull();
  });
});
