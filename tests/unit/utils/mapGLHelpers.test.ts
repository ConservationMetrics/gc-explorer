import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

import { loadMapIcon } from "@/utils/mapGLHelpers";

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

const drawImage = vi.fn();
const fakeImageData = { width: 0, height: 0 } as ImageData;
const getImageData = vi.fn(() => fakeImageData);

beforeEach(() => {
  vi.stubGlobal("Image", StubImage);
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockImplementation(
    () =>
      ({ drawImage, getImageData }) as unknown as CanvasRenderingContext2D,
  );
  nextImageState = { shouldFail: false, naturalWidth: 100, naturalHeight: 80 };
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

  it("rasterizes SVG icons via an offscreen canvas at their natural size", async () => {
    nextImageState.naturalWidth = 256;
    nextImageState.naturalHeight = 256;

    const result = await loadMapIcon("/api/proxy-icon?url=foo.svg", true);

    expect(result).toBe(fakeImageData);
    expect(drawImage).toHaveBeenCalledWith(
      expect.any(StubImage),
      0,
      0,
      256,
      256,
    );
    expect(getImageData).toHaveBeenCalledWith(0, 0, 256, 256);
  });

  it("falls back to 64x64 when the SVG has no intrinsic dimensions", async () => {
    nextImageState.naturalWidth = 0;
    nextImageState.naturalHeight = 0;

    await loadMapIcon("/api/proxy-icon?url=foo.svg", true);

    expect(getImageData).toHaveBeenCalledWith(0, 0, 64, 64);
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
