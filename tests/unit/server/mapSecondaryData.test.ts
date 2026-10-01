import { beforeEach, describe, expect, it, vi } from "vitest";
import type { H3Event } from "h3";
import { secondaryRows } from "@/tests/fixtures/secondaryGeometry";
import handler from "@/server/api/[table]/map";
import { buildMinimalFeatureCollection } from "@/utils/geoUtils";
import { fetchTableSqlColumns } from "@/server/database/dbOperations";

const mocks = vi.hoisted(() => ({
  fetchData: vi.fn(),
  fetchTableConfig: vi.fn(),
  fetchViewTables: vi.fn(),
  validatePermissions: vi.fn(),
  fetchInformationSchemaColumns: vi.fn(),
}));
vi.mock("@/server/database/dbOperations", () => ({
  ...mocks,
  fetchTableSqlColumns: vi.fn(async () => [
    "_id",
    "g__type",
    "g__coordinates",
    "name",
    "photo",
  ]),
}));
vi.mock("@/utils/accessControls", () => ({
  validatePermissions: mocks.validatePermissions,
}));
vi.mock("@/server/utils", () => ({ parseBasemaps: () => ({ basemaps: [] }) }));
vi.mock("@/server/utils/dbHelpers", () => ({
  getTableParam: () => "observations",
  parseAndValidateLimit: () => 5,
}));

describe("Map secondary dataset", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("useRuntimeConfig", () => ({
      public: { allowedFileExtensions: {} },
    }));
    vi.stubGlobal("sendError", (_event: unknown, error: Error) => {
      throw error;
    });
    mocks.fetchTableConfig.mockResolvedValue({
      ROUTE_LEVEL_PERMISSION: "member",
    });
    mocks.fetchViewTables.mockResolvedValue({
      primaryTable: "observations",
      secondaryTable: "mapping",
    });
    mocks.fetchData.mockImplementation(async (table: string) => ({
      mainData: table === "mapping" ? secondaryRows : [],
    }));
  });
  const get = () => handler({} as H3Event);
  it("keeps primary data empty while returning all five secondary geometries and truncation", async () => {
    const body = await get();
    expect(body).toMatchObject({
      primary_dataset: "observations",
      table: "observations",
      secondary_dataset: "mapping",
      data: { features: [] },
      rowLimitReached: true,
    });
    expect(body.secondaryData?.features.map((f) => f.geometry.type)).toEqual(
      secondaryRows.map((r) => r.g__type),
    );
    expect(
      body.secondaryData?.features.every((f) => typeof f.id === "number"),
    ).toBe(true);
    expect(mocks.validatePermissions).toHaveBeenCalledWith({}, "member");
    expect(mocks.fetchData).toHaveBeenCalledWith("mapping", {
      limit: 5,
      mainColumns: ["_id", "g__type", "g__coordinates"],
    });
  });
  it("omits unrelated secondary properties while preserving geometry, identity and color", async () => {
    const rows = secondaryRows.map((row) => ({
      ...row,
      notes: "Large record content".repeat(1000),
      color: "#FF0000",
    }));
    mocks.fetchData.mockImplementation(async (table: string) => ({
      mainData: table === "mapping" ? rows : [],
    }));
    const body = await get();
    const previous = buildMinimalFeatureCollection(rows, {
      includeAllProperties: true,
    });
    expect(body.secondaryData?.features).toEqual(
      previous.features.map((feature) => ({
        ...feature,
        properties: {
          _id: feature.properties!._id,
          "filter-color": feature.properties!["filter-color"],
        },
      })),
    );
  });
  it("preserves configured primary styling and filtering fields", async () => {
    mocks.fetchTableConfig.mockResolvedValue({
      COLOR_COLUMN: "color",
      ICON_COLUMN: "icon",
      FRONT_END_FILTER_COLUMN: "category",
      TIMESTAMP_COLUMN: "timestamp",
    });
    mocks.fetchInformationSchemaColumns.mockResolvedValue([
      "color",
      "icon",
      "category",
      "timestamp",
    ]);
    const rows = [
      {
        ...secondaryRows[0],
        color: "#FF0000",
        icon: "camera",
        category: "deployment",
        timestamp: "2026-01-01",
      },
    ];
    mocks.fetchData.mockResolvedValue({ mainData: rows });
    const body = await get();
    expect(mocks.fetchData).toHaveBeenCalledWith("observations", {
      limit: 5,
      mainColumns: [
        "_id",
        "g__type",
        "g__coordinates",
        "color",
        "icon",
        "category",
        "timestamp",
      ],
    });
    expect(body.data.features[0].properties).toMatchObject({
      _id: "1",
      color: "#FF0000",
      icon: "camera",
      category: "deployment",
      timestamp: "2026-01-01",
    });
    expect(body.secondaryData?.features[0].properties).toEqual({
      _id: "1",
      "filter-color": "#3333FF",
    });
  });
  it("preserves optional document IDs and their Mapbox feature IDs", async () => {
    vi.mocked(fetchTableSqlColumns)
      .mockResolvedValueOnce(["_id", "g__type", "g__coordinates"])
      .mockResolvedValueOnce([
        "_id",
        "id",
        "g__type",
        "g__coordinates",
        "notes",
      ]);
    const rows = [{ ...secondaryRows[0], id: "abcdef0123456789" }];
    mocks.fetchData.mockResolvedValue({ mainData: rows });
    const body = await get();
    expect(mocks.fetchData).toHaveBeenCalledWith("mapping", {
      limit: 5,
      mainColumns: ["_id", "id", "g__type", "g__coordinates"],
    });
    expect(body.secondaryData?.features[0].id).toBe(
      buildMinimalFeatureCollection(rows, { includeAllProperties: true })
        .features[0].id,
    );
    expect(body.secondaryData?.features[0].properties).toEqual({
      _id: "1",
      id: "abcdef0123456789",
      "filter-color": "#3333FF",
    });
  });
  it("does not fetch an unconfigured secondary table", async () => {
    mocks.fetchViewTables.mockResolvedValue({
      primaryTable: "observations",
      secondaryTable: null,
    });
    expect(await get()).toMatchObject({
      secondaryData: null,
      rowLimitReached: false,
    });
    expect(mocks.fetchData).toHaveBeenCalledTimes(1);
  });
  it.each([
    { rows: [] },
    { rows: [{ _id: "bad", g__type: "Point", g__coordinates: "invalid" }] },
  ])("returns null for empty or invalid secondary data", async ({ rows }) => {
    mocks.fetchData.mockResolvedValue({ mainData: rows });
    expect(await get()).toMatchObject({
      secondaryData: null,
      rowLimitReached: false,
    });
  });
  it("signals truncation even if every limited secondary row has invalid geometry", async () => {
    mocks.fetchData.mockImplementation(async (table: string) => ({
      mainData:
        table === "mapping"
          ? Array.from({ length: 5 }, (_, index) => ({
              _id: String(index),
              g__type: "Point",
              g__coordinates: null,
            }))
          : [],
    }));
    expect(await get()).toMatchObject({
      secondaryData: null,
      rowLimitReached: true,
    });
  });
  it("retains the primary response and its row-limit signal", async () => {
    mocks.fetchData.mockImplementation(async (table: string) => ({
      mainData: table === "observations" ? secondaryRows : [],
    }));
    const body = await get();
    expect(body.data.features).toHaveLength(5);
    expect(body.secondaryData).toBeNull();
    expect(body.rowLimitReached).toBe(true);
  });
  it("denies the request before loading either dataset", async () => {
    mocks.validatePermissions.mockRejectedValueOnce(new Error("Forbidden"));
    await expect(get()).rejects.toThrow("Forbidden");
    expect(mocks.fetchData).not.toHaveBeenCalled();
  });
});
