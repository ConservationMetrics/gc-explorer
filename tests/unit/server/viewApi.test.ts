import { describe, expect, it } from "vitest";

import type { H3Event } from "h3";
import {
  parseCreateViewBody,
  parseUpdateViewBody,
  parseViewId,
} from "@/server/utils/viewApi";

describe("view API input parsing", () => {
  it("parses a valid view ID", () => {
    const event = {
      context: { params: { view_id: "42" } },
    } as H3Event;

    expect(parseViewId(event)).toBe(42);
  });

  it("rejects invalid view IDs", () => {
    for (const viewId of [undefined, "", "0", "-1", "1.5", "view"]) {
      const event = {
        context: { params: { view_id: viewId } },
      } as H3Event;

      expect(() => parseViewId(event)).toThrow(
        expect.objectContaining({ statusCode: 400 }),
      );
    }
  });

  it("parses a valid create body", () => {
    expect(
      parseCreateViewBody({
        primaryDataset: "test_dataset",
        viewConfig: { ROUTE_LEVEL_PERMISSION: "member" },
        viewType: "gallery",
      }),
    ).toEqual({
      primaryDataset: "test_dataset",
      secondaryDataset: undefined,
      viewConfig: { ROUTE_LEVEL_PERMISSION: "member" },
      viewType: "gallery",
    });
  });

  it("rejects invalid create bodies", () => {
    for (const body of [
      null,
      {},
      { primaryDataset: "", viewType: "gallery" },
      { primaryDataset: "test_dataset", viewType: "dashboard" },
      {
        primaryDataset: "test_dataset",
        secondaryDataset: 2,
        viewType: "gallery",
      },
      {
        primaryDataset: "test_dataset",
        viewConfig: [],
        viewType: "gallery",
      },
    ]) {
      expect(() => parseCreateViewBody(body)).toThrow(
        expect.objectContaining({ statusCode: 400 }),
      );
    }
  });

  it("requires an object viewConfig for updates", () => {
    expect(() => parseUpdateViewBody({})).toThrow(
      expect.objectContaining({ statusCode: 400 }),
    );
    expect(() => parseUpdateViewBody({ viewConfig: [] })).toThrow(
      expect.objectContaining({ statusCode: 400 }),
    );
  });
});
