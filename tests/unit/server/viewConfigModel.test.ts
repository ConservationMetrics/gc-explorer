import { beforeEach, describe, expect, it, vi } from "vitest";
import { toConfigView, toViewType } from "@/utils/viewTypes";

const mocks = vi.hoisted(() => {
  const where = vi.fn();
  const set = vi.fn(() => ({ where }));
  const update = vi.fn(() => ({ set }));
  const onConflictDoNothing = vi.fn();
  const values = vi.fn(() => ({ onConflictDoNothing }));
  const insert = vi.fn(() => ({ values }));
  const execute = vi.fn(async () => [{ to_regclass: "views" }]);

  return {
    configDb: {
      delete: vi.fn(),
      execute,
      insert,
      select: vi.fn(),
      update,
    },
    warehouseDb: {
      execute: vi.fn(),
    },
    insert,
    onConflictDoNothing,
    set,
    update,
    values,
    where,
  };
});

vi.mock("@/server/database/dbConnection", () => ({
  configDb: mocks.configDb,
  warehouseDb: mocks.warehouseDb,
}));

vi.mock("/server/database/dbConnection", () => ({
  configDb: mocks.configDb,
  warehouseDb: mocks.warehouseDb,
}));

describe("single-table view config model", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("normalizes between config VIEWS and stored view_type values", async () => {
    expect(toViewType("alerts")).toBe("alert");
    expect(toViewType("alert")).toBe("alert");
    expect(toViewType("map")).toBe("map");
    expect(toViewType("gallery")).toBe("gallery");
    expect(toConfigView("alert")).toBe("alerts");
    expect(toConfigView("map")).toBe("map");
    expect(toConfigView("gallery")).toBe("gallery");
  });

  it("writes alert view metadata and secondary dataset on config update", async () => {
    const { updateConfig } = await import("@/server/database/dbOperations");

    await updateConfig(
      "fake_alerts",
      {
        DATASET_TABLE: "Fake Alerts",
        MAPEO_TABLE: "mapeo_data",
        ROUTE_LEVEL_PERMISSION: "anyone",
        VIEWS: "alerts",
      },
      "alert",
    );

    expect(mocks.update).toHaveBeenCalledTimes(1);
    expect(mocks.set).toHaveBeenCalledWith({
      primaryDataset: "fake_alerts",
      secondaryDataset: "mapeo_data",
      viewConfig: JSON.stringify({
        DATASET_TABLE: "Fake Alerts",
        MAPEO_TABLE: "mapeo_data",
        ROUTE_LEVEL_PERMISSION: "anyone",
        VIEWS: "alerts",
      }),
      viewName: "Fake Alerts",
      viewType: "alert",
    });
    expect(mocks.where).toHaveBeenCalledTimes(1);
    expect(mocks.insert).toHaveBeenCalledTimes(1);
    expect(mocks.values).toHaveBeenCalledWith({ tableName: "fake_alerts" });
    expect(mocks.onConflictDoNothing).toHaveBeenCalledTimes(1);
  });
});
