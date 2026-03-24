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
  "getResponseHeader",
  vi.fn((_event: unknown, name: string) => responseHeaders[name]),
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
    for (const key of Object.keys(responseHeaders)) {
      Reflect.deleteProperty(responseHeaders, key);
    }
    for (const key of Object.keys(requestHeaders)) {
      Reflect.deleteProperty(requestHeaders, key);
    }
    removedHeaders.length = 0;
    hookCallback = registeredHooks["beforeResponse"] as typeof hookCallback;
  });

  it("registers the beforeResponse hook", () => {
    expect(hookCallback).toBeDefined();
  });

  it("compresses with brotli when client accepts br", async () => {
    requestHeaders["accept-encoding"] = "gzip, deflate, br";
    responseHeaders["content-type"] = "application/json";

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
    responseHeaders["content-type"] = "application/json";

    const original = JSON.stringify({ data: "test-payload" });
    const response = { body: original } as { body: unknown };

    await hookCallback({ path: "/api/test/map" }, response);

    expect(responseHeaders["content-encoding"]).toBe("gzip");

    const decompressed = gunzipSync(response.body as Buffer).toString();
    expect(decompressed).toBe(original);
  });

  it("serializes object bodies before compressing", async () => {
    requestHeaders["accept-encoding"] = "br";
    responseHeaders["content-type"] = "application/json";

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
    responseHeaders["content-type"] = "application/json";

    const original = JSON.stringify({ data: "test" });
    const response = { body: original };

    await hookCallback({ path: "/api/test/data" }, response);

    expect(responseHeaders["content-encoding"]).toBeUndefined();
    expect(response.body).toBe(original);
  });

  it("skips /_nuxt internal routes", async () => {
    requestHeaders["accept-encoding"] = "gzip, br";
    responseHeaders["content-type"] = "application/javascript";

    const original = "static asset content";
    const response = { body: original };

    await hookCallback({ path: "/_nuxt/chunk-abc.js" }, response);

    expect(responseHeaders["content-encoding"]).toBeUndefined();
    expect(response.body).toBe(original);
  });

  it("skips responses with no body", async () => {
    requestHeaders["accept-encoding"] = "gzip, br";
    responseHeaders["content-type"] = "application/json";

    const response = { body: undefined };

    await hookCallback({ path: "/api/test/data" }, response);

    expect(responseHeaders["content-encoding"]).toBeUndefined();
  });

  it("skips binary responses like images", async () => {
    requestHeaders["accept-encoding"] = "gzip, br";
    responseHeaders["content-type"] = "image/png";

    const pngBytes = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a]);
    const response = { body: pngBytes } as { body: unknown };

    await hookCallback({ path: "/gcexplorer.png" }, response);

    expect(responseHeaders["content-encoding"]).toBeUndefined();
    expect(response.body).toBe(pngBytes);
  });

  it("compresses SVG (text-based image format)", async () => {
    requestHeaders["accept-encoding"] = "br";
    responseHeaders["content-type"] = "image/svg+xml";

    const svg = '<svg xmlns="http://www.w3.org/2000/svg"><circle r="5"/></svg>';
    const response = { body: svg } as { body: unknown };

    await hookCallback({ path: "/icon.svg" }, response);

    expect(responseHeaders["content-encoding"]).toBe("br");
    const decompressed = brotliDecompressSync(
      response.body as Buffer,
    ).toString();
    expect(decompressed).toBe(svg);
  });

  it("skips responses with no content-type", async () => {
    requestHeaders["accept-encoding"] = "gzip, br";

    const response = { body: Buffer.from([0xff, 0xd8, 0xff]) } as {
      body: unknown;
    };

    await hookCallback({ path: "/unknown-file" }, response);

    expect(responseHeaders["content-encoding"]).toBeUndefined();
  });
});
