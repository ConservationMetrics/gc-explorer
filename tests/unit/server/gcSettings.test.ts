import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { getBackgroundImage } from "@/server/utils/gcSettings";

const { mockLimit } = vi.hoisted(() => ({
  mockLimit: vi.fn(),
}));

vi.mock("@/server/database/dbConnection", () => ({
  configDb: {
    select: () => ({
      from: () => ({
        where: () => ({
          limit: mockLimit,
        }),
      }),
    }),
  },
}));

vi.mock("/server/database/dbConnection", () => ({
  configDb: {
    select: () => ({
      from: () => ({
        where: () => ({
          limit: mockLimit,
        }),
      }),
    }),
  },
}));

describe("getBackgroundImage", () => {
  beforeEach(() => {
    mockLimit.mockReset();
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns the trimmed background_image value", async () => {
    mockLimit.mockResolvedValue([{ value: "  https://cdn.example/bg.jpg  " }]);
    expect(await getBackgroundImage()).toBe("https://cdn.example/bg.jpg");
  });

  it("returns an empty string when the setting is missing", async () => {
    mockLimit.mockResolvedValue([]);
    expect(await getBackgroundImage()).toBe("");
  });

  it("returns an empty string when the table is unavailable", async () => {
    mockLimit.mockRejectedValue(
      new Error('relation "gc_settings" does not exist'),
    );
    expect(await getBackgroundImage()).toBe("");
  });
});
