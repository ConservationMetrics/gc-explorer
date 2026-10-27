import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { H3Event } from "h3";
import handler from "@/server/api/[table]/data";
import { Role } from "@/types";

const mocks = vi.hoisted(() => ({
  fetchTableConfig: vi.fn(),
  fetchTableSqlColumns: vi.fn(),
  fetchData: vi.fn(),
  getUserSession: vi.fn(),
  sendError: vi.fn(),
}));

vi.mock("@/server/database/dbOperations", () => mocks);
vi.mock("@/server/utils/dbHelpers", () => ({
  getTableParam: () => "observations",
  parseAndValidateLimit: () => 100,
}));
vi.mock("#imports", () => ({
  useRuntimeConfig: () => ({ public: { authStrategy: "auth0" } }),
}));

describe("data endpoint permissions", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.stubGlobal("getQuery", () => ({}));
    vi.stubGlobal(
      "createError",
      (options: { statusCode: number; statusMessage: string }) =>
        Object.assign(new Error(options.statusMessage), options),
    );
    vi.stubGlobal("getUserSession", mocks.getUserSession);
    vi.stubGlobal("sendError", mocks.sendError);
    vi.spyOn(console, "error").mockImplementation(() => {});
    mocks.getUserSession.mockResolvedValue({});
    mocks.fetchTableSqlColumns.mockResolvedValue(["_id"]);
    mocks.fetchData.mockResolvedValue({
      mainData: [{ _id: "1" }],
      columnsData: [],
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  describe.each([undefined, null])("permission is %s", (permission) => {
    beforeEach(() => {
      mocks.fetchTableConfig.mockResolvedValue({
        MEDIA_COLUMN: "photo",
        ...(permission === undefined ? {} : { ROUTE_LEVEL_PERMISSION: null }),
      });
    });

    it.each([
      ["anonymous", undefined, 401],
      ["signed in", Role.SignedIn, 403],
      ["guest", Role.Guest, 403],
    ])(
      "denies %s access before reading data",
      async (_label, role, statusCode) => {
        mocks.getUserSession.mockResolvedValue({
          user: role === undefined ? undefined : { userRole: role },
        });

        await handler({} as H3Event);

        expect(mocks.sendError).toHaveBeenCalledWith(
          {},
          expect.objectContaining({ statusCode }),
        );
        expect(mocks.fetchTableSqlColumns).not.toHaveBeenCalled();
        expect(mocks.fetchData).not.toHaveBeenCalled();
      },
    );

    it.each([Role.Member, Role.Admin])("allows role %s", async (role) => {
      mocks.getUserSession.mockResolvedValue({ user: { userRole: role } });

      await expect(handler({} as H3Event)).resolves.toMatchObject({
        data: [{ _id: "1" }],
      });
      expect(mocks.sendError).not.toHaveBeenCalled();
    });
  });

  it("preserves anonymous access when explicitly public", async () => {
    mocks.fetchTableConfig.mockResolvedValue({
      ROUTE_LEVEL_PERMISSION: "anyone",
    });

    await expect(handler({} as H3Event)).resolves.toMatchObject({
      data: [{ _id: "1" }],
    });
    expect(mocks.getUserSession).not.toHaveBeenCalled();
    expect(mocks.sendError).not.toHaveBeenCalled();
  });
});
