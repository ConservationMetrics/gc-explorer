import { describe, it, expect, vi, beforeEach } from "vitest";
import { brotliDecompressSync, gunzipSync } from "node:zlib";

type HookFn = (...args: unknown[]) => Promise<void> | void;

const registeredHooks: Record<string, HookFn> = {};
const responseHeaders: Record<string, string> = {};
const requestHeaders: Record<string, string> = {};
const removedHeaders: string[] = [];

vi.stubGlobal(
  "defineNitroPlugin",
  vi.fn(
    (
      callback: (nitro: {
        hooks: { hook: (name: string, fn: HookFn) => void };
      }) => void,
    ) => {
      callback({
        hooks: {
          hook: (name: string, fn: HookFn) => {
            registeredHooks[name] = fn;
          },
        },
      });
    },
  ),
);

vi.stubGlobal(
  "getRequestHeader",
  vi.fn((_event: unknown, name: string) => requestHeaders[name]),
);
vi.stubGlobal(
  "setResponseHeader",
  vi.fn((_event: unknown, name: string, value: string) => {
    responseHeaders[name] = value;
  }),
);
vi.stubGlobal(
  "removeResponseHeader",
  vi.fn((_event: unknown, name: string) => {
    removedHeaders.push(name);
  }),
);

await import("@/server/plugins/compression");

describe("compression plugin", () => {
  let hookCallback: (
    event: { path: string },
    response: { body?: unknown },
  ) => Promise<void>;

  beforeEach(() => {
    vi.clearAllMocks();
    Object.keys(responseHeaders).forEach((key) => delete responseHeaders[key]);
    Object.keys(requestHeaders).forEach((key) => delete requestHeaders[key]);
    removedHeaders.length = 0;
    hookCallback = registeredHooks["beforeResponse"] as typeof hookCallback;
  });

  it("registers the beforeResponse hook", () => {
    expect(hookCallback).toBeDefined();
  });

  it("compresses with brotli when client accepts br", async () => {
    requestHeaders["accept-encoding"] = "gzip, deflate, br";

    const original = JSON.stringify({ data: "test-payload" });
    const response = { body: original } as { body: unknown };

    await hookCallback({ path: "/api/test/map" }, response);

    expect(responseHeaders["content-encoding"]).toBe("br");
    expect(responseHeaders["vary"]).toBe("Accept-Encoding");
    expect(removedHeaders).toContain("content-length");

    const decompressed = brotliDecompressSync(
      response.body as Buffer,
    ).toString();
    expect(decompressed).toBe(original);
  });

  it("falls back to gzip when client does not accept br", async () => {
    requestHeaders["accept-encoding"] = "gzip, deflate";

    const original = JSON.stringify({ data: "test-payload" });
    const response = { body: original } as { body: unknown };

    await hookCallback({ path: "/api/test/map" }, response);

    expect(responseHeaders["content-encoding"]).toBe("gzip");

    const decompressed = gunzipSync(response.body as Buffer).toString();
    expect(decompressed).toBe(original);
  });

  it("serializes object bodies before compressing", async () => {
    requestHeaders["accept-encoding"] = "br";

    const payload = { features: [{ id: 1 }, { id: 2 }] };
    const response = { body: payload } as { body: unknown };

    await hookCallback({ path: "/api/test/records" }, response);

    expect(responseHeaders["content-encoding"]).toBe("br");

    const decompressed = brotliDecompressSync(
      response.body as Buffer,
    ).toString();
    expect(decompressed).toBe(JSON.stringify(payload));
  });

  it("does not compress when client sends no Accept-Encoding", async () => {
    const original = JSON.stringify({ data: "test" });
    const response = { body: original };

    await hookCallback({ path: "/api/test/data" }, response);

    expect(responseHeaders["content-encoding"]).toBeUndefined();
    expect(response.body).toBe(original);
  });

  it("skips /_nuxt internal routes", async () => {
    requestHeaders["accept-encoding"] = "gzip, br";

    const original = "static asset content";
    const response = { body: original };

    await hookCallback({ path: "/_nuxt/chunk-abc.js" }, response);

    expect(responseHeaders["content-encoding"]).toBeUndefined();
    expect(response.body).toBe(original);
  });

  it("skips responses with no body", async () => {
    requestHeaders["accept-encoding"] = "gzip, br";

    const response = { body: undefined };

    await hookCallback({ path: "/api/test/data" }, response);

    expect(responseHeaders["content-encoding"]).toBeUndefined();
  });
});
