import { beforeEach, describe, expect, it, vi } from "vitest";

import type { H3Event } from "h3";
import deleteViewHandler from "@/server/api/views/[view_id].delete";
import getViewHandler from "@/server/api/views/[view_id].get";
import patchViewHandler from "@/server/api/views/[view_id].patch";
import getViewsHandler from "@/server/api/views/index.get";
import postViewHandler from "@/server/api/views/index.post";

const mocks = vi.hoisted(() => ({
  createView: vi.fn(),
  deleteView: vi.fn(),
  fetchViewConfigRow: vi.fn(),
  fetchViewConfigRows: vi.fn(),
  updateView: vi.fn(),
  validatePermissions: vi.fn(),
  validateUserSession: vi.fn(),
}));

vi.mock("@/server/database/dbOperations", () => ({
  createView: mocks.createView,
  deleteView: mocks.deleteView,
  fetchViewConfigRow: mocks.fetchViewConfigRow,
  fetchViewConfigRows: mocks.fetchViewConfigRows,
  updateView: mocks.updateView,
}));

vi.mock("@/utils/accessControls", () => ({
  validatePermissions: mocks.validatePermissions,
  validateUserSession: mocks.validateUserSession,
}));

const eventWithViewId = (viewId: string) =>
  ({ context: { params: { view_id: viewId } } }) as H3Event;

const viewRow = {
  primaryDataset: "test_dataset",
  secondaryDataset: null,
  viewConfig: { ROUTE_LEVEL_PERMISSION: "member" as const },
  viewId: 42,
  viewName: "Test Dataset",
  viewType: "gallery" as const,
};

describe("/api/views handlers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal(
      "getQuery",
      vi.fn(() => ({})),
    );
  });

  it("lists views with an optional primary dataset filter", async () => {
    vi.mocked(getQuery).mockReturnValue({ primary_dataset: "test_dataset" });
    mocks.fetchViewConfigRows.mockResolvedValue([viewRow]);

    const result = await (
      getViewsHandler as unknown as (event: H3Event) => Promise<unknown>
    )({ context: {} } as H3Event);

    expect(mocks.validateUserSession).toHaveBeenCalledOnce();
    expect(mocks.fetchViewConfigRows).toHaveBeenCalledWith("test_dataset");
    expect(result).toEqual([viewRow]);
  });

  it("creates a view and returns 201", async () => {
    vi.mocked(readBody).mockResolvedValue({
      primaryDataset: "test_dataset",
      viewConfig: viewRow.viewConfig,
      viewType: "gallery",
    });
    mocks.createView.mockResolvedValue(viewRow);
    const event = { context: {} } as H3Event;

    const result = await (
      postViewHandler as unknown as (event: H3Event) => Promise<unknown>
    )(event);

    expect(mocks.validatePermissions).toHaveBeenCalledWith(event, "admin");
    expect(mocks.createView).toHaveBeenCalledWith({
      primaryDataset: "test_dataset",
      secondaryDataset: undefined,
      viewConfig: viewRow.viewConfig,
      viewType: "gallery",
    });
    expect(setResponseStatus).toHaveBeenCalledWith(event, 201);
    expect(result).toEqual(viewRow);
  });

  it("gets one view by ID", async () => {
    mocks.fetchViewConfigRow.mockResolvedValue(viewRow);
    const event = eventWithViewId("42");

    const result = await (
      getViewHandler as unknown as (event: H3Event) => Promise<unknown>
    )(event);

    expect(mocks.validateUserSession).toHaveBeenCalledWith(event);
    expect(mocks.fetchViewConfigRow).toHaveBeenCalledWith(42);
    expect(result).toEqual(viewRow);
  });

  it("updates one view by ID", async () => {
    vi.mocked(readBody).mockResolvedValue({
      viewConfig: { ROUTE_LEVEL_PERMISSION: "anyone" },
    });
    mocks.updateView.mockResolvedValue(viewRow);
    const event = eventWithViewId("42");

    await (patchViewHandler as unknown as (event: H3Event) => Promise<unknown>)(
      event,
    );

    expect(mocks.validatePermissions).toHaveBeenCalledWith(event, "admin");
    expect(mocks.updateView).toHaveBeenCalledWith(42, {
      secondaryDataset: undefined,
      viewConfig: { ROUTE_LEVEL_PERMISSION: "anyone" },
    });
  });

  it("deletes one view by ID and returns 204", async () => {
    const event = eventWithViewId("42");

    await (
      deleteViewHandler as unknown as (event: H3Event) => Promise<unknown>
    )(event);

    expect(mocks.validatePermissions).toHaveBeenCalledWith(event, "admin");
    expect(mocks.deleteView).toHaveBeenCalledWith(42);
    expect(setResponseStatus).toHaveBeenCalledWith(event, 204);
  });
});
