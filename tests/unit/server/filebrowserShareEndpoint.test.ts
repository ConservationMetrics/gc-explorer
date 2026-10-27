import { beforeEach, describe, expect, it, vi } from "vitest";
import type { H3Event } from "h3";
import handler from "@/server/api/admin/resolve-filebrowser-share.post";

const mocks = vi.hoisted(() => ({ permissions: vi.fn(), resolve: vi.fn() }));
vi.mock("@/utils/accessControls", () => ({
  validatePermissions: mocks.permissions,
}));
vi.mock("@/server/utils/filebrowserShare", () => ({
  resolveFilebrowserShare: mocks.resolve,
}));
const event = { context: {} } as H3Event;
const call = () =>
  (handler as unknown as (e: H3Event) => Promise<unknown>)(event);
const config = {
  enabled: true,
  origin: "https://files.example.com",
  username: "admin",
  password: "secret",
  storagePrefix: "datalake",
};

describe("share resolution endpoint", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("setHeader", vi.fn());
    vi.stubGlobal(
      "useRuntimeConfig",
      vi.fn(() => ({ filebrowserResolution: config })),
    );
    vi.mocked(readBody).mockResolvedValue({
      shareUrl: "https://files.example.com/share/abc",
    });
  });
  it("requires admin and returns an explicitly unverified path", async () => {
    mocks.resolve.mockResolvedValue({ smbPath: "datalake/media" });
    expect(await call()).toEqual({
      smbPath: "datalake/media",
      verified: false,
    });
    expect(mocks.permissions).toHaveBeenCalledWith(event, "admin");
  });
  it("does not resolve when disabled or when admin access is denied", async () => {
    vi.stubGlobal(
      "useRuntimeConfig",
      vi.fn(() => ({ filebrowserResolution: { ...config, enabled: false } })),
    );
    await expect(call()).rejects.toMatchObject({ statusCode: 404 });
    expect(mocks.resolve).not.toHaveBeenCalled();
    mocks.permissions.mockRejectedValueOnce(new Error("Forbidden"));
    await expect(call()).rejects.toThrow("Forbidden");
    expect(mocks.resolve).not.toHaveBeenCalled();
  });
});
