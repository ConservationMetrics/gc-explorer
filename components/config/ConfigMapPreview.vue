<script setup lang="ts">
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
} from "vue";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import type { ViewConfig } from "@/types";

const props = defineProps<{
  config: ViewConfig;
  mapboxStyle: string;
  accessToken: string;
}>();
const emit = defineEmits<{
  (e: "updateConfig", payload: Partial<ViewConfig>): void;
}>();
const container = ref<HTMLElement>();
const ready = ref(false);
let map: mapboxgl.Map | undefined;
let resizeObserver: ResizeObserver | undefined;
let applyingCamera = false;

/**
 * Reads a saved coordinate or numeric field within its map limits.
 * @param value - Saved field value; coordinates can be strings.
 * @param min - Minimum accepted value.
 * @param max - Maximum accepted value.
 * @returns A finite number within the limits, or zero for an empty field.
 */
const cameraNumber = (
  value: string | number | undefined,
  min: number,
  max: number,
) => {
  const number = typeof value === "string" ? parseFloat(value) : (value ?? 0);
  return Number.isFinite(number) ? Math.min(max, Math.max(min, number)) : 0;
};

const camera = computed(() => ({
  center: [
    cameraNumber(props.config.MAPBOX_CENTER_LONGITUDE, -180, 180),
    cameraNumber(props.config.MAPBOX_CENTER_LATITUDE, -90, 90),
  ] as [number, number],
  zoom: cameraNumber(props.config.MAPBOX_ZOOM, 0, 22),
  pitch: cameraNumber(props.config.MAPBOX_PITCH, 0, 85),
  bearing: cameraNumber(props.config.MAPBOX_BEARING, -180, 180),
}));

/**
 * Writes camera movements to the form without echoing manual field edits.
 * @returns Nothing.
 */
const updateConfig = () => {
  if (!map || !ready.value || applyingCamera) return;
  const center = map.getCenter().wrap();
  emit("updateConfig", {
    MAPBOX_CENTER_LATITUDE: center.lat.toString(),
    MAPBOX_CENTER_LONGITUDE: center.lng.toString(),
    MAPBOX_ZOOM: map.getZoom(),
    MAPBOX_PITCH: map.getPitch(),
    MAPBOX_BEARING: map.getBearing(),
  });
};

/**
 * Resizes the canvas without changing the form values.
 * @returns Nothing.
 */
const resizeMap = () => {
  applyingCamera = true;
  map?.resize();
  applyingCamera = false;
};

/**
 * Releases the map and its container observer.
 * @returns Nothing.
 */
const dispose = () => {
  resizeObserver?.disconnect();
  map?.remove();
  map = undefined;
};

watch(camera, (value) => {
  if (!map) return;
  const center = map.getCenter().wrap();
  if (
    Math.abs(value.center[0] - center.lng) < 1e-8 &&
    Math.abs(value.center[1] - center.lat) < 1e-8 &&
    Math.abs(value.zoom - map.getZoom()) < 1e-8 &&
    Math.abs(value.pitch - map.getPitch()) < 1e-8 &&
    Math.abs(value.bearing - map.getBearing()) < 1e-8
  )
    return;
  applyingCamera = true;
  map.jumpTo(value);
  applyingCamera = false;
});

onMounted(() => {
  try {
    map = new mapboxgl.Map({
      container: container.value!,
      accessToken: props.accessToken,
      style: props.mapboxStyle,
      ...camera.value,
      minZoom: 0,
      maxZoom: 22,
      maxPitch: 85,
    });
    map.addControl(new mapboxgl.NavigationControl({ visualizePitch: true }));
    map.on("move", updateConfig);
    map.on("load", async () => {
      ready.value = true;
      await nextTick();
      resizeMap();
    });
    map.on("error", () => {
      ready.value = false;
      dispose();
    });
    resizeObserver = new ResizeObserver(resizeMap);
    resizeObserver.observe(container.value!);
  } catch {
    ready.value = false;
    dispose();
  }
});

onBeforeUnmount(dispose);
</script>

<template>
  <div
    v-show="ready"
    ref="container"
    class="h-80 w-full overflow-hidden rounded-xl border border-violet-100"
    data-testid="config-map-preview"
  ></div>
</template>
