import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { H3Event } from "h3";
import handler from "@/server/api/[table]/export.get";

const mocks = vi.hoisted(() => ({
  fetchViewConfigForDatasetRead: vi.fn(),
  fetchData: vi.fn(),
  fetchTableSqlColumns: vi.fn(),
  validatePermissions: vi.fn(),
}));
vi.mock("@/server/database/dbOperations", () => mocks);
vi.mock("@/utils/accessControls", () => ({
  validatePermissions: mocks.validatePermissions,
}));
vi.mock("@/server/utils/dbHelpers", () => ({ getTableParam: () => "mapping" }));

describe("secondary dataset exports", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.stubGlobal("setResponseHeader", vi.fn());
    mocks.fetchViewConfigForDatasetRead.mockResolvedValue({
      ROUTE_LEVEL_PERMISSION: "member",
    });
    mocks.fetchTableSqlColumns.mockResolvedValue([
      "_id",
      "name",
      "g__type",
      "g__coordinates",
    ]);
    mocks.fetchData.mockResolvedValue({
      mainData: [
        {
          _id: "1",
          name: "Camera deployment",
          g__type: "Point",
          g__coordinates: "[-60,5]",
        },
        {
          _id: "2",
          name: "Other record",
          g__type: "Point",
          g__coordinates: "[-61,5]",
        },
      ],
      columnsData: null,
    });
  });
  afterEach(() => vi.unstubAllGlobals());

  const request = (
    format = "csv",
    primaryDataset: string | undefined = "observations",
  ) => {
    vi.stubGlobal("getQuery", () => ({
      format,
      recordId: "1",
      view_type: "map",
      primary_dataset: primaryDataset,
    }));
    return handler({} as H3Event);
  };

  it.each(["csv", "geojson", "kml"])(
    "exports the selected secondary row as %s using parent permissions",
    async (format) => {
      const result = await request(format);
      expect(mocks.fetchViewConfigForDatasetRead).toHaveBeenCalledWith(
        "mapping",
        {
          viewType: "map",
          primaryDataset: "observations",
        },
      );
      expect(mocks.validatePermissions).toHaveBeenCalledWith({}, "member");
      expect(mocks.fetchData).toHaveBeenCalledWith("mapping", {
        mainColumns: ["_id", "name", "g__type", "g__coordinates"],
        includeColumnsData: true,
      });
      const content =
        typeof result === "string" ? result : JSON.stringify(result);
      expect(content).toContain("Camera deployment");
      expect(content).not.toContain("Other record");
    },
  );

  it("does not read warehouse data when the parent view rejects access", async () => {
    mocks.validatePermissions.mockRejectedValue(
      Object.assign(new Error("Forbidden"), { statusCode: 403 }),
    );
    await expect(request()).rejects.toMatchObject({ statusCode: 403 });
    expect(mocks.fetchData).not.toHaveBeenCalled();
    expect(mocks.fetchTableSqlColumns).not.toHaveBeenCalled();
  });

  it("does not read warehouse data when the dataset is not configured under the parent", async () => {
    mocks.fetchViewConfigForDatasetRead.mockRejectedValue(
      Object.assign(new Error("Not a configured secondary dataset"), {
        statusCode: 403,
      }),
    );
    await expect(request()).rejects.toMatchObject({ statusCode: 403 });
    expect(mocks.fetchData).not.toHaveBeenCalled();
  });

  it("retains standalone dataset permission resolution without a parent", async () => {
    vi.stubGlobal("getQuery", () => ({
      format: "csv",
      recordId: "1",
      view_type: "map",
    }));
    await handler({} as H3Event);
    expect(mocks.fetchViewConfigForDatasetRead).toHaveBeenCalledWith(
      "mapping",
      {
        viewType: "map",
        primaryDataset: undefined,
      },
    );
  });
});
