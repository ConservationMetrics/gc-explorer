import { beforeEach, describe, expect, it, vi } from "vitest";

describe("GET /_info", () => {
  const setResponseHeader = vi.fn();

  beforeEach(() => {
    vi.resetModules();
    setResponseHeader.mockReset();
    vi.stubGlobal("setResponseHeader", setResponseHeader);
    vi.stubGlobal("defineNitroPlugin", (plugin: unknown) => plugin);
    vi.stubGlobal("useRuntimeConfig", () => ({
      deploy: {
        tag: "20261012-189",
        commit: "abc123",
      },
      app: { buildId: "build-1" },
    }));
  });

  it("returns the baked identity and does not cache", async () => {
    const { default: handler } = await import("@/server/routes/_info.get");
    const event = {};

    expect(handler(event)).toEqual({
      tag: "20261012-189",
      commit: "abc123",
      buildId: "build-1",
      startedAt: expect.any(String),
    });
    expect(setResponseHeader).toHaveBeenCalledWith(
      event,
      "cache-control",
      "no-store",
    );
  });
});
