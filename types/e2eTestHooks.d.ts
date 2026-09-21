import type { Map as MapboxMap } from "mapbox-gl";

declare global {
  interface Window {
    _testMap?: MapboxMap;
    getTestMap: () => MapboxMap;
    _testHandleDateRangeChanged?: (range: [string, string]) => void;
  }
}

export {};
