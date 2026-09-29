import type { LayerSpecification, Map as MapboxMap } from "mapbox-gl";

export const SECONDARY_SOURCE_ID = "secondary-data";
export const SECONDARY_INTERACTIVE_LAYER_IDS = [
  SECONDARY_SOURCE_ID,
  "secondary-data-line",
  "secondary-data-polygon",
];
export const SECONDARY_LAYER_IDS = [
  ...SECONDARY_INTERACTIVE_LAYER_IDS,
  "secondary-data-stroke",
];
const selected = ["boolean", ["feature-state", "selected"], false];
const incidentSelected = [
  "boolean",
  ["feature-state", "incidentSelected"],
  false,
];
const blue = ["coalesce", ["get", "filter-color"], "#3333FF"];
const color = ["case", incidentSelected, "#FFFF00", selected, "#00E5FF", blue];

/**
 * Gives Map and Alerts the same secondary geometry styling and selection states.
 * Geometry filters let one GeoJSON source feed point, line and polygon layers;
 * Mapbox groups multipart lines and polygons with their corresponding types.
 * Returns fresh definitions so layers can be installed again after a style change.
 */
export const secondaryMapLayers = (): LayerSpecification[] =>
  [
    {
      id: SECONDARY_SOURCE_ID,
      source: SECONDARY_SOURCE_ID,
      type: "circle",
      filter: ["==", "$type", "Point"],
      paint: {
        "circle-radius": 6,
        "circle-color": ["case", incidentSelected, "#FFFF00", blue],
        "circle-stroke-width": ["case", selected, 3, 2],
        "circle-stroke-color": ["case", selected, "#00E5FF", "#fff"],
      },
    },
    {
      id: "secondary-data-line",
      source: SECONDARY_SOURCE_ID,
      type: "line",
      filter: ["==", "$type", "LineString"],
      paint: {
        "line-color": color,
        "line-width": ["case", selected, 6, 3],
      },
    },
    {
      id: "secondary-data-polygon",
      source: SECONDARY_SOURCE_ID,
      type: "fill",
      filter: ["==", "$type", "Polygon"],
      paint: {
        "fill-color": color,
        "fill-opacity": 0.5,
      },
    },
    {
      id: "secondary-data-stroke",
      source: SECONDARY_SOURCE_ID,
      type: "line",
      filter: ["==", "$type", "Polygon"],
      paint: {
        "line-color": color,
        "line-width": ["case", selected, 5, 2],
      },
    },
  ] as LayerSpecification[];

/**
 * Makes the secondary dataset behave as one legend entry even though several
 * layers draw it. Toggle every layer, including polygon outlines, and tolerate
 * missing layers while the map style is being recreated.
 */
export const setSecondaryDataLayerVisibility = (
  map: Pick<MapboxMap, "getLayer" | "setLayoutProperty">,
  visibility: "visible" | "none",
) => {
  SECONDARY_LAYER_IDS.forEach((id) => {
    if (map.getLayer(id)) map.setLayoutProperty(id, "visibility", visibility);
  });
};
