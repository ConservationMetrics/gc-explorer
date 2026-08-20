import { beforeEach, describe, expect, it, vi } from "vitest";

import configColumnsHandler from "@/server/api/config/columns/[table].get";

const hoisted = vi.hoisted(() => {
  Object.assign(globalThis, {
    defineEventHandler: (handler: unknown) => handler,
  });

  return {
    fetchTableColumnEntries: vi.fn(),
    getTableParam: vi.fn(),
    validatePermissions: vi.fn(),
  };
});

vi.mock("@/server/database/dbOperations", () => ({
  fetchTableColumnEntries: hoisted.fetchTableColumnEntries,
}));

vi.mock("@/server/utils/dbHelpers", () => ({
  getTableParam: hoisted.getTableParam,
}));

vi.mock("@/utils/accessControls", () => ({
  validatePermissions: hoisted.validatePermissions,
}));

type ConfigColumnsHandler = (
  event: Record<string, unknown>,
) => Promise<Record<string, unknown>>;

const handleConfigColumnsRequest =
  configColumnsHandler as unknown as ConfigColumnsHandler;

describe("config columns endpoint", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    hoisted.getTableParam.mockReturnValue("survey_data");
    hoisted.fetchTableColumnEntries.mockResolvedValue([
      {
        original_column: "Status",
        sql_column: "status",
      },
    ]);
  });

  it("returns mapped columns without fetching dataset rows", async () => {
    const event = {};

    const response = await handleConfigColumnsRequest(event);

    expect(hoisted.validatePermissions).toHaveBeenCalledWith(event, "admin");
    expect(hoisted.fetchTableColumnEntries).toHaveBeenCalledWith("survey_data");
    expect(response).toEqual({
      table: "survey_data",
      columns: [
        {
          original_column: "Status",
          sql_column: "status",
        },
      ],
    });
  });
});
