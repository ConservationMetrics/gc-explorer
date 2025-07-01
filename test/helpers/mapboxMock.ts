/* Mapbox GL mock helper for Vitest component tests.
   Usage: import * as mapboxMock from '@/test/helpers/mapboxMock'
   The first import registers the vi.mock('mapbox-gl', …) stubs. */

import { vi } from "vitest";

// internal state ---------------------------------------------------------
export const layers: Array<Record<string, unknown>> = [];
let loadCallback: (() => void) | undefined;
const clickCallbacks: Record<string, Array<(evt: unknown) => void>> = {};

// spyable helpers --------------------------------------------------------
export const Map = vi.fn(() => mockMap);
export const NavigationControl = vi.fn();
export const ScaleControl = vi.fn();
export const FullscreenControl = vi.fn();
export const addControl = vi.fn();
export const setFeatureState = vi.fn();

// public helpers ---------------------------------------------------------
export function fireLoad(): void {
  loadCallback?.();
}

export function fireClick(layerId: string, evt: unknown): void {
  clickCallbacks[layerId]?.forEach((cb) => cb(evt));
}

export function reset(): void {
  Map.mockClear();
  NavigationControl.mockClear();
  ScaleControl.mockClear();
  FullscreenControl.mockClear();
  addControl.mockClear();
  setFeatureState.mockClear();
  layers.length = 0;
  loadCallback = undefined;
  Object.keys(clickCallbacks).forEach((k) => {
    // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
    delete clickCallbacks[k];
  });
}

// mock map object --------------------------------------------------------
const mockMap = {
  on: vi.fn((event: string, layerOrCb: unknown, cb?: unknown) => {
    if (event === "load") {
      loadCallback = layerOrCb as () => void;
    } else if (event === "click" && typeof layerOrCb === "string" && cb) {
      (clickCallbacks[layerOrCb] ||= []).push(cb as (evt: unknown) => void);
    }
  }),
  addControl,
  addSource: vi.fn(),
  addLayer: vi.fn((layer: Record<string, unknown>) => layers.push(layer)),
  getStyle: vi.fn(() => ({ layers })),
  getLayer: vi.fn(() => false),
  getSource: vi.fn(() => true),
  getCanvas: vi.fn(() => ({ style: { cursor: "" } })),
  loadImage: vi.fn(
    (_url: string, cb: (err: unknown, img: HTMLImageElement) => void) =>
      cb(null, new Image()),
  ),
  hasImage: vi.fn(() => false),
  addImage: vi.fn(),
  setFeatureState,
  queryRenderedFeatures: vi.fn(() => []),
  setFilter: vi.fn(),
  setLayoutProperty: vi.fn(),
  once: vi.fn(),
  flyTo: vi.fn(),
  fitBounds: vi.fn(),
  remove: vi.fn(),
};

// Register global module mock -------------------------------------------
vi.mock("mapbox-gl", () => {
  const stub = {
    Map,
    NavigationControl,
    ScaleControl,
    FullscreenControl,
    Marker: vi.fn(() => ({
      setLngLat: vi.fn().mockReturnThis(),
      addTo: vi.fn().mockReturnThis(),
    })),
  } as Record<string, unknown>;
  return {
    __esModule: true,
    default: stub,
    ...stub,
  };
});

vi.mock("mapbox-gl-ruler-control", () => ({ default: vi.fn(() => ({})) }));
