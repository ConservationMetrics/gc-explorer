import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  logServerProfilingMark,
  snapshotProcessMemory,
  triggerGcIfAvailable,
  withServerProfiling,
} from "@/server/utils/serverProfiling";

describe("serverProfiling", () => {
  const originalEnv = process.env.SERVER_PROFILING;

  beforeEach(() => {
    delete process.env.SERVER_PROFILING;
  });

  afterEach(() => {
    if (originalEnv === undefined) {
      delete process.env.SERVER_PROFILING;
    } else {
      process.env.SERVER_PROFILING = originalEnv;
    }
    vi.restoreAllMocks();
  });

  it("snapshotProcessMemory returns numeric usage fields", () => {
    const snap = snapshotProcessMemory();
    expect(typeof snap.heapUsed).toBe("number");
    expect(typeof snap.heapTotal).toBe("number");
    expect(typeof snap.rss).toBe("number");
    expect(typeof snap.external).toBe("number");
    expect(snap.heapUsed).toBeGreaterThan(0);
  });

  it("triggerGcIfAvailable returns false when gc is not exposed", () => {
    expect(triggerGcIfAvailable()).toBe(false);
  });

  it("logServerProfilingMark does not log when SERVER_PROFILING is unset", () => {
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    logServerProfilingMark("test-mark", { n: 1 });
    expect(logSpy).not.toHaveBeenCalled();
  });

  it("logServerProfilingMark logs when SERVER_PROFILING=1", () => {
    process.env.SERVER_PROFILING = "1";
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    logServerProfilingMark("test-mark", { n: 2 });
    expect(logSpy).toHaveBeenCalledTimes(1);
    const line = logSpy.mock.calls[0][0] as string;
    expect(line).toContain("[server-prof]");
    expect(line).toContain("test-mark");
    expect(line).toContain("heapUsed");
  });

  it("withServerProfiling does not log when SERVER_PROFILING is unset", async () => {
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    const out = await withServerProfiling("block", () => 42);
    expect(out).toBe(42);
    expect(logSpy).not.toHaveBeenCalled();
  });

  it("withServerProfiling logs timing and heap delta when SERVER_PROFILING=1", async () => {
    process.env.SERVER_PROFILING = "1";
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    const out = await withServerProfiling("my-block", async () => {
      return "ok";
    });
    expect(out).toBe("ok");
    expect(logSpy).toHaveBeenCalledTimes(1);
    const raw = logSpy.mock.calls[0][0] as string;
    const payload = JSON.parse(raw.replace(/^\[server-prof\] /, ""));
    expect(payload.label).toBe("my-block");
    expect(typeof payload.ms).toBe("number");
    expect(typeof payload.heapUsedDelta).toBe("number");
    expect(payload.threw).toBeUndefined();
  });

  it("withServerProfiling marks threw when callback rejects", async () => {
    process.env.SERVER_PROFILING = "1";
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    await expect(
      withServerProfiling("failing-block", async () => {
        throw new Error("boom");
      }),
    ).rejects.toThrow("boom");
    const raw = logSpy.mock.calls[0][0] as string;
    const payload = JSON.parse(raw.replace(/^\[server-prof\] /, ""));
    expect(payload.threw).toBe(true);
  });
});
