import { beforeEach, describe, expect, it, vi } from "vitest";

import galleryHandler from "@/server/api/[table]/gallery";

type GalleryRouteEvent = {
  context: { params: { table: string } };
};

type GalleryRouteResponse = Record<string, unknown>;

type GalleryRouteHandler = (
  event: GalleryRouteEvent,
) => Promise<GalleryRouteResponse>;

const handleGalleryRequest = galleryHandler as unknown as GalleryRouteHandler;

const hoisted = vi.hoisted(() => {
  Object.assign(globalThis, {
    defineEventHandler: (handler: unknown) => handler,
    useRuntimeConfig: () => ({
      public: {
        allowedFileExtensions: {
          audio: ["mp3", "m4a"],
          image: ["jpg", "webp"],
          video: ["mp4"],
        },
      },
    }),
  });

  return {
    fetchData: vi.fn(),
    fetchTableConfig: vi.fn(),
    fetchTableSqlColumns: vi.fn(),
    fetchViewTables: vi.fn(),
    filterDataByExtension: vi.fn(),
    filterOutUnwantedValues: vi.fn(),
    filterUnwantedKeys: vi.fn(),
    parseAndValidateLimit: vi.fn(),
    validatePermissions: vi.fn(),
  };
});

vi.mock("@/server/database/dbOperations", () => ({
  fetchData: hoisted.fetchData,
  fetchTableConfig: hoisted.fetchTableConfig,
  fetchTableSqlColumns: hoisted.fetchTableSqlColumns,
  fetchViewTables: hoisted.fetchViewTables,
}));

vi.mock("@/server/dataProcessing/dataFilters", async (importOriginal) => {
  const actual =
    await importOriginal<
      typeof import("@/server/dataProcessing/dataFilters")
    >();
  return {
    ...actual,
    filterDataByExtension: hoisted.filterDataByExtension,
    filterOutUnwantedValues: hoisted.filterOutUnwantedValues,
    filterUnwantedKeys: hoisted.filterUnwantedKeys,
  };
});

vi.mock("@/server/utils/dbHelpers", () => ({
  parseAndValidateLimit: hoisted.parseAndValidateLimit,
}));

vi.mock("@/utils/accessControls", () => ({
  validatePermissions: hoisted.validatePermissions,
}));

describe("gallery endpoint datasets", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    hoisted.parseAndValidateLimit.mockReturnValue(25);
    hoisted.fetchTableConfig.mockResolvedValue({
      MEDIA_BASE_PATH: "/media",
      MEDIA_COLUMN: "photo",
      ROUTE_LEVEL_PERMISSION: "anyone",
    });
    hoisted.fetchViewTables.mockResolvedValue({
      primaryTable: "gallery_dataset",
      secondaryTable: null,
    });
    hoisted.fetchData.mockResolvedValue({
      mainData: [{ _id: "record-1", photo: "one.jpg" }],
      columnsData: [{ original_column: "Photo", sql_column: "photo" }],
      metadata: null,
    });
    hoisted.filterUnwantedKeys.mockImplementation((data) => data);
    hoisted.filterOutUnwantedValues.mockImplementation((data) => data);
    hoisted.filterDataByExtension.mockImplementation((data) => data);
  });

  it("fetches gallery data from the typed primary dataset and returns it", async () => {
    const response = await handleGalleryRequest({
      context: { params: { table: "route_gallery" } },
    });

    expect(hoisted.fetchTableConfig).toHaveBeenCalledWith(
      "route_gallery",
      "gallery",
    );
    expect(hoisted.fetchViewTables).toHaveBeenCalledWith(
      "route_gallery",
      "gallery",
    );
    expect(hoisted.fetchData).toHaveBeenCalledWith("gallery_dataset", {
      limit: 25,
      mainColumns: ["_id", "photo"],
      includeColumnsData: true,
    });
    expect(response.primary_dataset).toBe("gallery_dataset");
    expect(response.table).toBe("gallery_dataset");
    expect(response.data).toEqual([{ _id: "record-1", photo: "one.jpg" }]);
  });

  it("includes multi-column media fields on list items when MEDIA_COLUMN is unset", async () => {
    hoisted.fetchTableConfig.mockResolvedValue({
      MEDIA_BASE_PATH: "/media",
      ROUTE_LEVEL_PERMISSION: "anyone",
      FRONT_END_FILTER_COLUMN: "community",
    });
    hoisted.fetchTableSqlColumns.mockResolvedValue([
      "_id",
      "community",
      "photo",
      "audio",
      "notes",
    ]);
    hoisted.fetchData.mockResolvedValue({
      mainData: [
        {
          _id: "record-1",
          community: "matses",
          photo: "scene.webp",
          audio: "clip.m4a",
          notes: "no media here",
        },
      ],
      columnsData: [],
      metadata: null,
    });

    const response = await handleGalleryRequest({
      context: { params: { table: "route_gallery" } },
    });

    expect(response.data).toEqual([
      {
        _id: "record-1",
        community: "matses",
        photo: "scene.webp",
        audio: "clip.m4a",
      },
    ]);
  });

  it("returns view title and description from the view config", async () => {
    hoisted.fetchTableConfig.mockResolvedValue({
      MEDIA_BASE_PATH: "/media",
      MEDIA_COLUMN: "photo",
      ROUTE_LEVEL_PERMISSION: "anyone",
      DATASET_TABLE: " Community photos ",
      VIEW_DESCRIPTION: "Field media from the survey.",
    });

    const response = await handleGalleryRequest({
      context: { params: { table: "route_gallery" } },
    });

    expect(response.viewName).toBe("Community photos");
    expect(response.viewDescription).toBe("Field media from the survey.");
  });
});
