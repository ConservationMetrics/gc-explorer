import { beforeEach, describe, expect, it, vi } from "vitest";

const mockFetchAlertsViewDatasets = vi.fn();
const mockFetchTableConfig = vi.fn();
const mockFetchData = vi.fn();
const mockValidatePermissions = vi.fn();

vi.mock("@/server/database/dbOperations", () => ({
  fetchAlertsViewDatasets: (table: string) => mockFetchAlertsViewDatasets(table),
  fetchTableConfig: (table: string) => mockFetchTableConfig(table),
  fetchData: (table: string, limit?: number) => mockFetchData(table, limit),
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

    mockFetchData.mockResolvedValue({
      mainData: [{ _id: "1", alertID: "a1" }],
      columnsData: null,
      metadata: [],
    });
  });

  it("returns structured dataset fields and tolerates null secondary dataset", async () => {
    mockFetchAlertsViewDatasets.mockResolvedValue({
      primaryDataset: "alerts_confidential",
      secondaryDataset: null,
    });

    const { default: handler } = await import("@/server/api/[table]/alerts");
    const response = await handler({
      context: { params: { table: "alerts_confidential" } },
    } as never);

    expect(mockFetchData).toHaveBeenCalledWith("alerts_confidential", 100);
    expect(mockFetchData).toHaveBeenCalledTimes(1);
    expect(response.primary_dataset).toBe("alerts_confidential");
    expect(response.secondary_dataset).toBeNull();
  });
});
