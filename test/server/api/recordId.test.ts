import "./setupGlobals";
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.stubGlobal("useRuntimeConfig", () => ({
  public: { allowedFileExtensions: { audio: [], image: [], video: [] } },
}));

vi.mock("@/server/database/dbOperations", () => ({
  fetchConfig: vi.fn(),
  fetchRecordById: vi.fn(),
}));

vi.mock("@/utils/auth", () => ({
  validatePermissions: vi.fn().mockResolvedValue(undefined),
}));

import recordHandler from "@/server/api/[table]/[recordId].get";
import * as dbOperations from "@/server/database/dbOperations";

function createMockEvent(table: string, recordId: string) {
  return {
    context: { params: { table, recordId } },
  } as unknown as Parameters<typeof recordHandler>[0];
}

describe("GET api/[table]/[recordId]", () => {
  beforeEach(() => {
    vi.mocked(dbOperations.fetchConfig).mockResolvedValue({
      seed_survey_data: { ROUTE_LEVEL_PERMISSION: "anyone" },
    });
    vi.mocked(dbOperations.fetchRecordById).mockResolvedValue({
      _id: "id-1",
      g__type: "Point",
      g__coordinates: "[-76.5, 3.44]",
      community: "A",
    });
  });

  it("returns 200 and raw record when found", async () => {
    const event = createMockEvent("seed_survey_data", "id-1");
    const response = await recordHandler(event);

    expect(response).toEqual({
      _id: "id-1",
      g__type: "Point",
      g__coordinates: "[-76.5, 3.44]",
      community: "A",
    });
    expect(dbOperations.fetchRecordById).toHaveBeenCalledWith(
      "seed_survey_data",
      "id-1",
    );
  });

  it("returns 404 when record not found", async () => {
    vi.mocked(dbOperations.fetchRecordById).mockResolvedValue(null);
    const event = createMockEvent("seed_survey_data", "missing-id");

    await expect(recordHandler(event)).rejects.toThrow("Record not found");
  });

  it("returns 400 when recordId is empty", async () => {
    const event = createMockEvent("seed_survey_data", "");

    await expect(recordHandler(event)).rejects.toThrow("recordId is required");
  });

  it("returns 404 when table config is missing", async () => {
    vi.mocked(dbOperations.fetchConfig).mockResolvedValue({});
    const event = createMockEvent("nonexistent_table", "id-1");

    await expect(recordHandler(event)).rejects.toThrow(
      "Table config not found",
    );
  });
});
