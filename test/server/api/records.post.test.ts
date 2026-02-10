import "./setupGlobals";
import { describe, it, expect, vi, beforeEach } from "vitest";
import recordsHandler from "@/server/api/[table]/records.post";
import * as dbOperations from "@/server/database/dbOperations";

vi.stubGlobal("useRuntimeConfig", () => ({
  public: { allowedFileExtensions: { audio: [], image: [], video: [] } },
}));

vi.mock("@/server/database/dbOperations", () => ({
  fetchConfig: vi.fn(),
  fetchRecordsByIds: vi.fn(),
  BULK_RECORDS_MAX_IDS: 100,
}));

vi.mock("@/utils/auth", () => ({
  validatePermissions: vi.fn().mockResolvedValue(undefined),
}));

function createMockEvent(table: string, body: { ids: string[] }) {
  return {
    context: { params: { table } },
    body,
  } as unknown as Parameters<typeof recordsHandler>[0];
}

describe("POST api/[table]/records", () => {
  beforeEach(() => {
    vi.mocked(dbOperations.fetchConfig).mockResolvedValue({
      seed_survey_data: { ROUTE_LEVEL_PERMISSION: "anyone" },
    });
    vi.mocked(dbOperations.fetchRecordsByIds).mockResolvedValue([
      { _id: "1", g__type: "Point", g__coordinates: "[0,0]" },
      { _id: "2", g__type: "Point", g__coordinates: "[1,1]" },
    ]);
  });

  it("returns 200 and records in request order", async () => {
    const event = createMockEvent("seed_survey_data", { ids: ["1", "2"] });
    const response = await recordsHandler(event);

    expect(response).toEqual({
      records: [
        { _id: "1", g__type: "Point", g__coordinates: "[0,0]" },
        { _id: "2", g__type: "Point", g__coordinates: "[1,1]" },
      ],
    });
    expect(dbOperations.fetchRecordsByIds).toHaveBeenCalledWith(
      "seed_survey_data",
      ["1", "2"],
    );
  });

  it("returns 400 when body is not { ids: array }", async () => {
    const event = {
      context: { params: { table: "seed_survey_data" } },
      body: null,
    } as unknown as Parameters<typeof recordsHandler>[0];

    await expect(recordsHandler(event)).rejects.toMatchObject({
      statusCode: 400,
      statusMessage: "Request body must be { ids: string[] }",
    });
  });

  it("returns 400 when too many ids", async () => {
    const manyIds = Array.from({ length: 101 }, (_, i) => String(i));
    const event = createMockEvent("seed_survey_data", { ids: manyIds });

    await expect(recordsHandler(event)).rejects.toMatchObject({
      statusCode: 400,
      statusMessage: /maximum 100/,
    });
  });

  it("returns 404 when table config is missing", async () => {
    vi.mocked(dbOperations.fetchConfig).mockResolvedValue({});
    const event = createMockEvent("nonexistent_table", { ids: ["1"] });

    await expect(recordsHandler(event)).rejects.toThrow(
      "Table config not found",
    );
  });
});
