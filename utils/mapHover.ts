import type { Map as MapboxMap } from "mapbox-gl";

/** Mapbox treats the layers as one hover target, including where they overlap. */
export const attachMapHover = (
  map: MapboxMap,
  layerIds: string[],
  onHoverChange?: (hovered: boolean) => void,
) => {
  map.on("mouseenter", layerIds, () => {
    onHoverChange?.(true);
    map.getCanvas().style.cursor = "pointer";
  });
  map.on("mouseleave", layerIds, () => {
    onHoverChange?.(false);
    map.getCanvas().style.cursor = "";
  });
};
