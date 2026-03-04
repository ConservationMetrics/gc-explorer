import { describe, it, expect, vi, beforeEach } from "vitest";

const registeredHooks: Record<string, Function> = {};
const mockUseCompression = vi.fn();
const mockGetResponseHeader = vi.fn();

vi.stubGlobal(
  "defineNitroPlugin",
  vi.fn((callback: (nitro: { hooks: { hook: Function } }) => void) => {
    callback({
      hooks: {
        hook: (name: string, fn: Function) => {
          registeredHooks[name] = fn;
        },
      },
    });
  }),
);

vi.mock("h3-compression", () => ({
  useCompression: (...args: unknown[]) => mockUseCompression(...args),
}));

vi.stubGlobal("getResponseHeader", mockGetResponseHeader);

const { isCompressible, COMPRESSIBLE_TYPES, MIN_COMPRESSION_SIZE } =
  await import("@/server/plugins/compression");

describe("compression plugin", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("isCompressible", () => {
    it("returns true for application/json", () => {
      expect(isCompressible("application/json")).toBe(true);
    });

    it("returns true for application/json with charset", () => {
      expect(isCompressible("application/json; charset=utf-8")).toBe(true);
    });

    it("returns true for application/geo+json", () => {
      expect(isCompressible("application/geo+json; charset=utf-8")).toBe(true);
    });

    it("returns true for text/csv", () => {
      expect(isCompressible("text/csv; charset=utf-8")).toBe(true);
    });

    it("returns true for KML content type", () => {
      expect(
        isCompressible("application/vnd.google-earth.kml+xml; charset=utf-8"),
      ).toBe(true);
    });

    it("returns true for text/html", () => {
      expect(isCompressible("text/html")).toBe(true);
    });

    it("returns true for text/xml", () => {
      expect(isCompressible("text/xml")).toBe(true);
    });

    it("returns true for application/xml", () => {
      expect(isCompressible("application/xml")).toBe(true);
    });

    it("returns false for image types", () => {
      expect(isCompressible("image/png")).toBe(false);
      expect(isCompressible("image/jpeg")).toBe(false);
    });

    it("returns false for already-compressed types", () => {
      expect(isCompressible("application/gzip")).toBe(false);
      expect(isCompressible("application/zip")).toBe(false);
    });

    it("returns false for undefined content type", () => {
      expect(isCompressible(undefined)).toBe(false);
    });

    it("returns false for empty string", () => {
      expect(isCompressible("")).toBe(false);
    });
  });

  describe("COMPRESSIBLE_TYPES", () => {
    it("includes all expected MIME types for API responses", () => {
      expect(COMPRESSIBLE_TYPES).toContain("application/json");
      expect(COMPRESSIBLE_TYPES).toContain("application/geo+json");
      expect(COMPRESSIBLE_TYPES).toContain(
        "application/vnd.google-earth.kml+xml",
      );
      expect(COMPRESSIBLE_TYPES).toContain("text/csv");
      expect(COMPRESSIBLE_TYPES).toContain("text/plain");
    });
  });

  describe("MIN_COMPRESSION_SIZE", () => {
    it("is set to 1024 bytes", () => {
      expect(MIN_COMPRESSION_SIZE).toBe(1024);
    });
  });

  describe("beforeResponse hook gating", () => {
    const hookCallback = registeredHooks["beforeResponse"] as (
      event: { path: string },
      response: { body?: unknown },
    ) => Promise<void>;

    it("registers the beforeResponse hook", () => {
      expect(hookCallback).toBeDefined();
      expect(typeof hookCallback).toBe("function");
    });

    it("skips non-API routes", async () => {
      mockGetResponseHeader.mockReturnValue("application/json");

      await hookCallback({ path: "/some-page" }, { body: "x".repeat(2000) });

      expect(mockUseCompression).not.toHaveBeenCalled();
    });

    it("skips non-compressible content types", async () => {
      mockGetResponseHeader.mockReturnValue("image/png");

      await hookCallback(
        { path: "/api/test/data" },
        { body: "x".repeat(2000) },
      );

      expect(mockUseCompression).not.toHaveBeenCalled();
    });

    it("skips responses with no body", async () => {
      mockGetResponseHeader.mockReturnValue("application/json");

      await hookCallback({ path: "/api/test/data" }, { body: undefined });

      expect(mockUseCompression).not.toHaveBeenCalled();
    });

    it("skips responses smaller than MIN_COMPRESSION_SIZE", async () => {
      mockGetResponseHeader.mockReturnValue("application/json");

      await hookCallback(
        { path: "/api/test/data" },
        { body: '{"small": true}' },
      );

      expect(mockUseCompression).not.toHaveBeenCalled();
    });

    it("compresses qualifying API responses", async () => {
      mockGetResponseHeader.mockReturnValue("application/json");

      const event = { path: "/api/test/map" };
      const response = { body: JSON.stringify({ data: "x".repeat(2000) }) };

      await hookCallback(event, response);

      expect(mockUseCompression).toHaveBeenCalledWith(event, response);
    });

    it("compresses CSV export responses", async () => {
      mockGetResponseHeader.mockReturnValue("text/csv; charset=utf-8");

      const event = { path: "/api/test/export" };
      const response = {
        body: "col1,col2\n" + "val1,val2\n".repeat(200),
      };

      await hookCallback(event, response);

      expect(mockUseCompression).toHaveBeenCalledWith(event, response);
    });

    it("compresses GeoJSON export responses", async () => {
      mockGetResponseHeader.mockReturnValue(
        "application/geo+json; charset=utf-8",
      );

      const event = { path: "/api/test/export" };
      const response = {
        body: JSON.stringify({
          type: "FeatureCollection",
          features: Array(100).fill({ type: "Feature", properties: {} }),
        }),
      };

      await hookCallback(event, response);

      expect(mockUseCompression).toHaveBeenCalledWith(event, response);
    });

    it("compresses object bodies by stringifying for size check", async () => {
      mockGetResponseHeader.mockReturnValue("application/json");

      const largeObject = { items: Array(100).fill({ id: "test-item" }) };
      const event = { path: "/api/test/records" };
      const response = { body: largeObject };

      await hookCallback(event, response);

      expect(mockUseCompression).toHaveBeenCalledWith(event, response);
    });
  });
});
