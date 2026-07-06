import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  fetchViewDatasetData,
  fetchViewDatasets,
} from "@/server/database/dbOperations";

const hoisted = vi.hoisted(() => {
  const selectChain = {
    from: vi.fn(),
    where: vi.fn(),
    limit: vi.fn(),
  };
  selectChain.from.mockReturnValue(selectChain);
  selectChain.where.mockReturnValue(selectChain);

  return {
    selectChain,
    configSelect: vi.fn(() => selectChain),
    warehouseExecute: vi.fn(),
    viewRows: [] as Array<{
      primaryDataset: string;
      secondaryDataset: string | null;
    }>,
  };
});

vi.mock("/server/database/dbConnection", () => ({
  configDb: {
    select: hoisted.configSelect,
  },
  warehouseDb: {
    execute: hoisted.warehouseExecute,
  },
  schema: {},
}));
vi.mock("@/server/database/dbConnection", () => ({
  configDb: {
    select: hoisted.configSelect,
  },
  warehouseDb: {
    execute: hoisted.warehouseExecute,
  },
  schema: {},
}));

describe("view dataset helpers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    hoisted.viewRows = [];
    hoisted.selectChain.limit.mockImplementation(() =>
      Promise.resolve(hoisted.viewRows),
    );
    hoisted.warehouseExecute.mockReset();

    Object.assign(globalThis, {
      useRuntimeConfig: () => ({ public: { rowLimit: 10 } }),
    });
  });

  it("returns primary and secondary datasets for the requested view", async () => {
    hoisted.viewRows = [
      { primaryDataset: "fake_alerts", secondaryDataset: "mapeo_data" },
    ];

    await expect(fetchViewDatasets("fake_alerts", "alerts")).resolves.toEqual({
      primaryDataset: "fake_alerts",
      secondaryDataset: "mapeo_data",
    });
  });

  it("normalizes a missing secondary dataset to null", async () => {
    hoisted.viewRows = [
      { primaryDataset: "gallery_data", secondaryDataset: null },
    ];

    await expect(fetchViewDatasets("gallery_data", "gallery")).resolves.toEqual(
      {
        primaryDataset: "gallery_data",
        secondaryDataset: null,
      },
    );
  });

  it("throws the missing-view error when no typed view row matches", async () => {
    await expect(
      fetchViewDatasets("missing_table", "alerts"),
    ).rejects.toMatchObject({
      statusCode: 404,
      statusMessage: 'No view configuration found for table "missing_table"',
    });
  });

  it("fetches primary data without secondary data", async () => {
    hoisted.warehouseExecute
      .mockResolvedValueOnce([{ to_regclass: "fake_alerts" }])
      .mockResolvedValueOnce([{ _id: "alert-1" }]);

    const result = await fetchViewDatasetData("fake_alerts", {
      secondaryDataset: null,
      primaryOptions: { mainColumns: ["_id"], limit: 10 },
    });

    expect(result.primaryData.mainData).toEqual([{ _id: "alert-1" }]);
    expect(result.secondaryData).toBeNull();
  });

  it("fetches primary and secondary data when secondary is configured", async () => {
    hoisted.warehouseExecute
      .mockResolvedValueOnce([{ to_regclass: "fake_alerts" }])
      .mockResolvedValueOnce([{ to_regclass: "mapeo_data" }])
      .mockResolvedValueOnce([{ _id: "alert-1" }])
      .mockResolvedValueOnce([{ _id: "mapeo-1" }]);

    const result = await fetchViewDatasetData("fake_alerts", {
      secondaryDataset: "mapeo_data",
      primaryOptions: { mainColumns: ["_id"], limit: 10 },
      secondaryOptions: { mainColumns: ["_id"], limit: 10 },
    });

    expect(result.primaryData.mainData).toEqual([{ _id: "alert-1" }]);
    expect(result.secondaryData?.mainData).toEqual([{ _id: "mapeo-1" }]);
  });
});
