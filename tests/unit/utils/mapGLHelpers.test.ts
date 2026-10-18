import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

import {
  buildIconImageExpression,
  isMapboxPublicToken,
  isSvgIconFilename,
  isUsableMapboxStyle,
  loadMapIcon,
  mapboxStyleToStudioUrl,
  mapIconImageId,
  SVG_MAP_ICON_BORDER_PX,
  SVG_MAP_ICON_SCALE,
} from "@/utils/mapGLHelpers";

/** Mutated by tests to drive the global `Image` stub for the next `new Image()`. */
let nextImageState = {
  shouldFail: false,
  naturalWidth: 100,
  naturalHeight: 80,
};

class StubImage {
  crossOrigin: string | null = null;
  onload: (() => void) | null = null;
  onerror: ((err: unknown) => void) | null = null;
  naturalWidth = nextImageState.naturalWidth;
  naturalHeight = nextImageState.naturalHeight;
  set src(_value: string) {
    const { shouldFail } = nextImageState;
    queueMicrotask(() => {
      if (shouldFail) this.onerror?.(new Error("img load failed"));
      else this.onload?.();
    });
  }
}

type DrawOp =
  | { op: "arc"; radius: number }
  | { op: "fill"; fillStyle: string }
  | { op: "stroke"; strokeStyle: string; lineWidth: number }
  | { op: "drawImage" };

const drawOps: DrawOp[] = [];
const drawImage = vi.fn(() => {
  drawOps.push({ op: "drawImage" });
});
const fakeImageData = { width: 0, height: 0 } as ImageData;
const getImageData = vi.fn(() => fakeImageData);

const mockCanvasContext = (): CanvasRenderingContext2D => {
  const ctx = {
    fillStyle: "",
    strokeStyle: "",
    lineWidth: 0,
    beginPath: () => {},
    arc: (_x: number, _y: number, radius: number) => {
      drawOps.push({ op: "arc", radius });
    },
    fill: () => {
      drawOps.push({ op: "fill", fillStyle: ctx.fillStyle });
    },
    stroke: () => {
      drawOps.push({
        op: "stroke",
        strokeStyle: ctx.strokeStyle,
        lineWidth: ctx.lineWidth,
      });
    },
    drawImage,
    getImageData,
  };
  return ctx as unknown as CanvasRenderingContext2D;
};

beforeEach(() => {
  vi.stubGlobal("Image", StubImage);
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockImplementation(() =>
    mockCanvasContext(),
  );
  nextImageState = { shouldFail: false, naturalWidth: 100, naturalHeight: 80 };
  drawOps.length = 0;
  drawImage.mockClear();
  getImageData.mockClear();
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("loadMapIcon", () => {
  it("returns the loaded HTMLImageElement directly for raster icons", async () => {
    const result = await loadMapIcon("/api/proxy-icon?url=foo.png", false);
    expect(result).toBeInstanceOf(StubImage);
    expect(getImageData).not.toHaveBeenCalled();
  });

  it("fits the full SVG inside a white disc that circumscribes it", async () => {
    nextImageState.naturalWidth = 256;
    nextImageState.naturalHeight = 256;
    const radius = Math.hypot(256, 256) / 2;
    const canvasSize = Math.ceil(radius * 2);
    const offset = canvasSize / 2 - 128;

    const result = await loadMapIcon("/api/proxy-icon?url=foo.svg", true);

    expect(result).toBe(fakeImageData);
    expect(drawOps.map((op) => op.op)).toEqual(["arc", "fill", "drawImage"]);
    expect(drawOps[0]).toMatchObject({ radius });
    expect(drawOps[1]).toMatchObject({ fillStyle: "#ffffff" });
    expect(drawImage).toHaveBeenCalledWith(
      expect.any(StubImage),
      offset,
      offset,
      256,
      256,
    );
    expect(radius).toBeGreaterThanOrEqual(128 * Math.SQRT2 - 1e-9);
    expect(getImageData).toHaveBeenCalledWith(0, 0, canvasSize, canvasSize);
  });

  it("centers a non-square SVG inside the circumscribed disc", async () => {
    nextImageState.naturalWidth = 100;
    nextImageState.naturalHeight = 40;
    const radius = Math.hypot(100, 40) / 2;
    const canvasSize = Math.ceil(radius * 2);

    await loadMapIcon("/api/proxy-icon?url=foo.svg", true);

    expect(drawImage).toHaveBeenCalledWith(
      expect.any(StubImage),
      canvasSize / 2 - 50,
      canvasSize / 2 - 20,
      100,
      40,
    );
    expect(drawOps[0]).toMatchObject({ radius });
    expect(getImageData).toHaveBeenCalledWith(0, 0, canvasSize, canvasSize);
  });

  it("strokes a circular border in the color-column hex, 2px on the map", async () => {
    nextImageState.naturalWidth = 80;
    nextImageState.naturalHeight = 80;
    const stroke = SVG_MAP_ICON_BORDER_PX / SVG_MAP_ICON_SCALE;
    const radius = Math.hypot(80, 80) / 2;
    const canvasSize = Math.ceil((radius + stroke) * 2);
    const offset = canvasSize / 2 - 40;

    await loadMapIcon("/api/proxy-icon?url=foo.svg", true, {
      borderColor: "#336699",
    });

    expect(drawOps.map((op) => op.op)).toEqual([
      "arc",
      "fill",
      "drawImage",
      "arc",
      "stroke",
    ]);
    expect(drawOps[0]).toMatchObject({ radius });
    expect(drawOps[1]).toMatchObject({ fillStyle: "#ffffff" });
    expect(drawOps[3]).toMatchObject({ radius: radius + stroke / 2 });
    expect(drawOps[4]).toMatchObject({
      strokeStyle: "#336699",
      lineWidth: stroke,
    });
    expect(drawImage).toHaveBeenCalledWith(
      expect.any(StubImage),
      offset,
      offset,
      80,
      80,
    );
    expect(getImageData).toHaveBeenCalledWith(0, 0, canvasSize, canvasSize);
    expect(stroke * SVG_MAP_ICON_SCALE).toBe(SVG_MAP_ICON_BORDER_PX);
  });

  it("ignores a border color for raster icons", async () => {
    const result = await loadMapIcon("/api/proxy-icon?url=foo.png", false, {
      borderColor: "#ff0000",
    });

    expect(result).toBeInstanceOf(StubImage);
    expect(drawOps).toEqual([]);
    expect(getImageData).not.toHaveBeenCalled();
  });

  it("falls back to 64x64 when the SVG has no intrinsic dimensions", async () => {
    nextImageState.naturalWidth = 0;
    nextImageState.naturalHeight = 0;

    await loadMapIcon("/api/proxy-icon?url=foo.svg", true);

    const canvasSize = Math.ceil(Math.hypot(64, 64));
    expect(getImageData).toHaveBeenCalledWith(0, 0, canvasSize, canvasSize);
  });

  it("rejects when the image fails to load", async () => {
    nextImageState.shouldFail = true;

    await expect(
      loadMapIcon("/api/proxy-icon?url=missing.png", false),
    ).rejects.toBeDefined();
  });

  it("throws when a 2D canvas context cannot be obtained", async () => {
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null);

    await expect(
      loadMapIcon("/api/proxy-icon?url=foo.svg", true),
    ).rejects.toThrow("Failed to get 2D canvas context");
  });
});

describe("map icon ids", () => {
  it("detects svg filenames case-insensitively", () => {
    expect(isSvgIconFilename("tree.svg")).toBe(true);
    expect(isSvgIconFilename("tree.SVG")).toBe(true);
    expect(isSvgIconFilename("tree.png")).toBe(false);
  });

  it("appends a border color only when one is provided", () => {
    expect(mapIconImageId("tree.svg")).toBe("icon-tree.svg");
    expect(mapIconImageId("tree.svg", "#336699")).toBe("icon-tree.svg-#336699");
  });

  it("builds a plain icon-image expression without a color column", () => {
    expect(buildIconImageExpression("icon")).toEqual([
      "concat",
      "icon-",
      ["get", "icon"],
    ]);
  });

  it("selects the bordered image id for svg icons that have a color", () => {
    expect(buildIconImageExpression("icon", "color")).toEqual([
      "case",
      [
        "all",
        [
          "==",
          ["slice", ["downcase", ["to-string", ["get", "icon"]]], -4],
          ".svg",
        ],
        ["!=", ["to-string", ["coalesce", ["get", "color"], ""]], ""],
      ],
      ["concat", "icon-", ["get", "icon"], "-", ["get", "color"]],
      ["concat", "icon-", ["get", "icon"]],
    ]);
  });
});

describe("mapboxStyleToStudioUrl", () => {
  it("returns a Studio URL for mapbox://styles/ values", () => {
    expect(
      mapboxStyleToStudioUrl("mapbox://styles/mapbox/satellite-streets-v12"),
    ).toBe(
      "https://console.mapbox.com/studio/styles/mapbox/satellite-streets-v12",
    );
    expect(mapboxStyleToStudioUrl("mapbox://styles/myuser/mystyle")).toBe(
      "https://console.mapbox.com/studio/styles/myuser/mystyle",
    );
  });

  it("returns null for empty or non-mapbox style values", () => {
    expect(mapboxStyleToStudioUrl("")).toBeNull();
    expect(mapboxStyleToStudioUrl("https://example.com/style.json")).toBeNull();
    expect(
      mapboxStyleToStudioUrl("mapbox://tilesets/mapbox/streets"),
    ).toBeNull();
  });

  it("returns null for inline style objects used by E2E seeds", () => {
    expect(
      mapboxStyleToStudioUrl({
        version: 8,
        sources: {},
        layers: [],
      }),
    ).toBeNull();
  });
});

describe("isUsableMapboxStyle", () => {
  it("accepts mapbox style URIs and inline style objects", () => {
    expect(
      isUsableMapboxStyle("mapbox://styles/mapbox/satellite-streets-v12"),
    ).toBe(true);
    expect(isUsableMapboxStyle({ version: 8, sources: {}, layers: [] })).toBe(
      true,
    );
  });

  it("rejects empty or malformed style URIs", () => {
    expect(isUsableMapboxStyle("")).toBe(false);
    expect(isUsableMapboxStyle("invalid-style")).toBe(false);
    expect(isUsableMapboxStyle(null)).toBe(false);
  });
});

describe("isMapboxPublicToken", () => {
  it("accepts pk.ey tokens without spaces", () => {
    expect(isMapboxPublicToken("pk.eyTestToken")).toBe(true);
    expect(isMapboxPublicToken("pk.eyJ1IjoiZXhhbXBsZSJ9.abc")).toBe(true);
  });

  it("rejects blank or malformed tokens", () => {
    expect(isMapboxPublicToken("")).toBe(false);
    expect(isMapboxPublicToken("   ")).toBe(false);
    expect(isMapboxPublicToken("invalid-token")).toBe(false);
    expect(isMapboxPublicToken("pk.ey token")).toBe(false);
  });
});
