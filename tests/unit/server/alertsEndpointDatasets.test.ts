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
    options?: {
      secondaryDataset?: string | null;
      limit?: number;
      primaryMainColumns?: string[];
      primaryMetadataColumns?: string[];
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

    mockFetchViewDatasetData.mockResolvedValue({
      primaryData: {
        mainData: [{ _id: "1", alertID: "a1" }],
        columnsData: null,
        metadata: [],
      },
      secondaryData: null,
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
      return Promise.resolve([]);
    });
  });

  it("returns structured dataset fields and tolerates null secondary dataset", async () => {
    mockFetchViewDatasets.mockResolvedValue({
      primaryDataset: "alerts_confidential",
      secondaryDatasets: [],
    });

    const { default: handler } = await import("@/server/api/[table]/alerts");
    const response = (await handler({
      context: { params: { table: "alerts_confidential" } },
    } as never)) as Record<string, unknown>;

    expect(mockFetchViewDatasets).toHaveBeenCalledWith(
      "alerts_confidential",
      "alerts",
    );
    expect(mockFetchViewDatasetData).toHaveBeenCalledWith(
      "alerts_confidential",
      expect.objectContaining({
        secondaryDataset: null,
        limit: 100,
        primaryMainColumns: expect.arrayContaining([
          "_id",
          "alert_id",
          "month_detec",
          "year_detec",
          "g__type",
          "g__coordinates",
        ]),
      }),
    );
    expect(mockFetchViewDatasetData).toHaveBeenCalledTimes(1);
    expect(response["primary_dataset"]).toBe("alerts_confidential");
    expect(response["secondary_dataset"]).toBeNull();
  });
});
