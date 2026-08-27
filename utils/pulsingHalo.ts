import type { ExpressionSpecification, Map as MapboxMap } from "mapbox-gl";
import type { HaloEntry, PulsingHaloLayerOptions } from "@/types";

const PULSE_DURATION_MS = 2000;
const HALO_COLOR = "#FF0000";
const HALO_GAP_PX = 4;
const STROKE_WIDTH_START = 4;
const STROKE_WIDTH_END = 10;
const NO_TRANSITION = { duration: 0, delay: 0 };

/** Matches most-recent unclustered point radius (5px). */
export const POINT_HALO_RADIUS = 5;
/** Same steps as most-recent-alerts-point-clusters circle-radius. */
export const POINT_CLUSTER_HALO_RADIUS: ExpressionSpecification = [
  "step",
  ["get", "point_count"],
  10,
  10,
  20,
  50,
  30,
];

/** Matches most-recent unclustered centroid radius (8px). */
export const CENTROID_HALO_RADIUS = 8;
/** Same steps as most-recent-alerts-centroids-clusters circle-radius. */
export const CENTROID_CLUSTER_HALO_RADIUS: ExpressionSpecification = [
  "step",
  ["get", "point_count"],
  15,
  10,
  25,
  50,
  35,
];

const haloEntries: HaloEntry[] = [];
let animationFrame = 0;

const withGap = (
  base: number | ExpressionSpecification,
): number | ExpressionSpecification =>
  typeof base === "number" ? base + HALO_GAP_PX : ["+", HALO_GAP_PX, base];

const tick = () => {
  const t = (performance.now() % PULSE_DURATION_MS) / PULSE_DURATION_MS;
  const strokeWidth =
    STROKE_WIDTH_START + (STROKE_WIDTH_END - STROKE_WIDTH_START) * t;
  const strokeOpacity = 1 - t;

  for (let i = haloEntries.length - 1; i >= 0; i--) {
    const entry = haloEntries[i];
    if (!entry.map.getLayer(entry.id)) {
      haloEntries.splice(i, 1);
      continue;
    }
    entry.map.setPaintProperty(entry.id, "circle-stroke-width", strokeWidth);
    entry.map.setPaintProperty(
      entry.id,
      "circle-stroke-opacity",
      strokeOpacity,
    );
  }

  animationFrame = haloEntries.length ? requestAnimationFrame(tick) : 0;
};

const ensureAnimation = () => {
  if (!animationFrame && haloEntries.length) {
    animationFrame = requestAnimationFrame(tick);
  }
};

const registerHalo = (map: MapboxMap, id: string) => {
  if (!haloEntries.some((entry) => entry.map === map && entry.id === id)) {
    haloEntries.push({ map, id });
  }
  ensureAnimation();
};

export const stopPulsingHalo = () => {
  if (animationFrame) cancelAnimationFrame(animationFrame);
  animationFrame = 0;
  haloEntries.length = 0;
};

const addHaloCircleLayer = (
  map: MapboxMap,
  id: string,
  sourceId: string,
  filter: ExpressionSpecification,
  baseRadius: number | ExpressionSpecification,
  maxzoom?: number,
) => {
  if (!map.getLayer(id)) {
    map.addLayer({
      id,
      type: "circle",
      source: sourceId,
      filter,
      ...(maxzoom != null ? { maxzoom } : {}),
      paint: {
        "circle-color": HALO_COLOR,
        "circle-radius": withGap(baseRadius),
        "circle-opacity": 0,
        "circle-stroke-width": STROKE_WIDTH_START,
        "circle-stroke-color": HALO_COLOR,
        "circle-stroke-opacity": 1,
        "circle-radius-transition": NO_TRANSITION,
        "circle-stroke-width-transition": NO_TRANSITION,
        "circle-stroke-opacity-transition": NO_TRANSITION,
      },
    });
    map.setPaintProperty(id, "circle-radius-transition", NO_TRANSITION);
    map.setPaintProperty(id, "circle-stroke-width-transition", NO_TRANSITION);
    map.setPaintProperty(id, "circle-stroke-opacity-transition", NO_TRANSITION);
  }
  registerHalo(map, id);
};

/**
 * Adds a red ring under most-recent alert dots and clusters.
 * Radius stays locked to the marker size so every cluster gets a ring;
 * only stroke width/opacity pulse, which avoids Mapbox expression crossfades.
 */
export const addPulsingHaloLayers = (
  map: MapboxMap,
  sourceId: string,
  options: PulsingHaloLayerOptions,
) => {
  addHaloCircleLayer(
    map,
    `${sourceId}-clusters-halo`,
    sourceId,
    ["has", "point_count"],
    options.clusterRadius,
    options.maxzoom,
  );
  addHaloCircleLayer(
    map,
    `${sourceId}-halo`,
    sourceId,
    ["!", ["has", "point_count"]],
    options.unclusteredRadius,
    options.maxzoom,
  );
};
