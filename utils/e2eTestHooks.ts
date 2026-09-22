import type { Map as MapboxMap } from "mapbox-gl";

export const exposeTestMap = (map: MapboxMap): void => {
  window._testMap = map;
  window.getTestMap = () => {
    if (!window._testMap) {
      throw new Error("Mapbox test hook is unavailable");
    }
    return window._testMap;
  };
};
