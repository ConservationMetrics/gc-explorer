import { beforeEach, describe, expect, it, vi } from "vitest";

const mockFetchViewDatasets = vi.fn();
const mockFetchTableConfig = vi.fn();
const mockFetchData = vi.fn();
const mockValidatePermissions = vi.fn();

vi.mock("@/server/database/dbOperations", () => ({
  fetchViewDatasets: (table: string, viewType: string) =>
    mockFetchViewDatasets(table, viewType),
  fetchTableConfig: (table: string) => mockFetchTableConfig(table),
  fetchData: (table: string, limit?: number) => mockFetchData(table, limit),
}));

vi.mock("@/utils/accessControls", () => ({
  validatePermissions: (event: unknown, permission?: string) =>
    mockValidatePermissions(event, permission),
}));

vi.mock("@/server/utils/dbHelpers", () => ({
  parseAndValidateLimit: () => 50,
}));

vi.mock("@/server/dataProcessing/dataFilters", () => ({
  filterUnwantedKeys: (rows: unknown[]) => rows,
  filterOutUnwantedValues: (rows: unknown[]) => rows,
  filterDataByExtension: (rows: unknown[]) => rows,
}));

vi.stubGlobal("defineEventHandler", (handler: unknown) => handler);
vi.stubGlobal("useRuntimeConfig", () => ({
  public: {
    allowedFileExtensions: { image: [], audio: [], video: [] },
  },
}));

describe("gallery endpoint dataset config", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockFetchViewDatasets.mockResolvedValue({
      primaryDataset: "seed_survey_data",
      secondaryDatasets: [],
    });

    mockFetchTableConfig.mockResolvedValue({
      ROUTE_LEVEL_PERMISSION: "anyone",
      MEDIA_COLUMN: "photos",
      FRONT_END_FILTER_COLUMN: "community",
      TIMESTAMP_COLUMN: "p__created",
      MEDIA_BASE_PATH: "https://example.com/media",
    });

    mockFetchData.mockResolvedValue({
      mainData: [{ _id: "abc123", photos: "img.jpg" }],
      columnsData: null,
      metadata: null,
    });
  });

  it("reads primary dataset from view_config_gallery and returns it in response", async () => {
    const { default: handler } = await import("@/server/api/[table]/gallery");
    const response = (await handler({
      context: { params: { table: "seed_survey_data" } },
    } as never)) as Record<string, unknown>;

    expect(mockFetchViewDatasets).toHaveBeenCalledWith(
      "seed_survey_data",
      "gallery",
    );
    expect(mockFetchData).toHaveBeenCalledWith("seed_survey_data", 50);
    expect(response["primary_dataset"]).toBe("seed_survey_data");
  });
});
