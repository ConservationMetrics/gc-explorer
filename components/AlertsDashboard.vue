<script setup lang="ts">
import { useI18n } from "vue-i18n";
import { useRoute, useRouter } from "vue-router";

import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

import { along, bbox, length, lineString } from "@turf/turf";

// @ts-expect-error - mapbox-gl-ruler-control does not have types
import rulerControl from "mapbox-gl-ruler-control";

import {
  changeMapStyle,
  prepareMapLegendLayers,
  prepareCoordinatesForSelectedFeature,
  toggleLayerVisibility as utilsToggleLayerVisibility,
} from "@/utils/mapFunctions";

import BasemapSelector from "@/components/shared/BasemapSelector.vue";
import ViewSidebar from "@/components/shared/ViewSidebar.vue";
import MapLegend from "@/components/shared/MapLegend.vue";

import type { Layer, MapMouseEvent } from "mapbox-gl";
import type {
  AlertsData,
  AlertsStatistics,
  AllowedFileExtensions,
  Basemap,
  Dataset,
  MapLegendItem,
} from "@/types/types";
import type { Feature, Geometry } from "geojson";

const { t } = useI18n();

const props = defineProps<{
  alertsData: AlertsData;
  alertsStatistics: AlertsStatistics;
  allowedFileExtensions: AllowedFileExtensions;
  logoUrl: string | undefined;
  mapLegendLayerIds: string | undefined;
  mapboxAccessToken: string;
  mapboxBearing: number | null;
  mapboxLatitude: number;
  mapboxLongitude: number;
  mapboxPitch: number | null;
  mapboxProjection: string;
  mapboxStyle: string;
  mapboxZoom: number;
  mapbox3d: boolean;
  mapeoData: Dataset | null;
  mediaBasePath: string | undefined;
  mediaBasePathAlerts: string | undefined;
  planetApiKey: string | undefined;
}>();

const localAlertsData = ref<Feature | AlertsData>(props.alertsData);
const calculateHectares = ref(false);
const dateOptions = ref();
const hasRulerControl = ref(false);
const map = ref();
const showBasemapSelector = ref(false);
const showIntroPanel = ref(true);
const showSidebar = ref(true);
const showSlider = ref(false);

const route = useRoute();
const router = useRouter();

const isMapeo = ref(false);

/**
 * Selects and zooms to an alert feature based on its ID
 */
const selectInitialAlertFeature = (alertId: string) => {
  const allFeatures = [
    ...props.alertsData.mostRecentAlerts.features,
    ...props.alertsData.previousAlerts.features,
  ];
  const feature = allFeatures.find((f) => f.properties?.alertID === alertId);
  if (feature?.properties) {
    // Find the appropriate layer ID for this feature by checking both recent and previous layers
    const geometryType = feature.geometry.type.toLowerCase();
    const recentLayerId = `most-recent-alerts-${geometryType}`;
    const previousLayerId = `previous-alerts-${geometryType}`;

    // Check if feature exists in recent layer
    const isInRecentLayer = props.alertsData.mostRecentAlerts.features.some(
      (f) => f.properties?.alertID === feature.properties?.alertID,
    );

    // Select feature in the correct layer
    const layerId = isInRecentLayer ? recentLayerId : previousLayerId;
    selectFeature(feature, layerId);

    // Zoom to the feature
    if (feature.geometry.type === "Point") {
      const [lng, lat] = feature.geometry.coordinates;
      map.value.flyTo({ center: [lng, lat], zoom: 13 });
    } else if (
      feature.geometry.type === "Polygon" ||
      feature.geometry.type === "MultiPolygon"
    ) {
      const bounds = bbox(feature);
      map.value.fitBounds(bounds, { padding: 50 });
    } else if (feature.geometry.type === "LineString") {
      const [lng, lat] = calculateLineStringCentroid(
        feature.geometry.coordinates,
      );
      map.value.flyTo({ center: [lng, lat], zoom: 13 });
    }
    isMapeo.value = false;
  }
};

/**
 * Selects and zooms to a Mapeo feature based on its document ID
 */
const selectInitialMapeoFeature = (mapeoDocId: string) => {
  const mapeoFeature = props.mapeoData?.find((f) => f.id === mapeoDocId);

  if (mapeoFeature) {
    const geometryType = mapeoFeature.geotype as
      | "Polygon"
      | "LineString"
      | "Point"
      | "MultiPoint"
      | "MultiLineString"
      | "MultiPolygon"
      | "GeometryCollection";

    // Create a new GeoJSON Feature object instead of using mapeoFeature directly for several critical reasons:
    //
    // 1. DATA FORMAT MISMATCH: Mapeo data comes as raw DataEntry objects, but Mapbox expects proper
    //    GeoJSON Feature objects with specific structure (type, geometry, properties, id).
    //
    // 2. ID NORMALIZATION REQUIREMENT: Mapeo document IDs are 64-bit hex strings (e.g., "0084cdc57c0b0280")
    //    that exceed JavaScript's safe integer range (2^53 - 1). Mapbox requires feature IDs to be either
    //    Numbers or strings that can be safely cast to Numbers. Without normalization, Mapbox falls back to
    //    undefined IDs, causing setFeatureState() to fail with "The feature id parameter must be provided."
    //    We use the normalized 53-bit safe integer (mapeoFeature.normalizedId) for Mapbox compatibility.
    //
    // 3. COORDINATE PARSING: The geometry coordinates are stored as JSON strings in the raw data but need
    //    to be parsed into array format for GeoJSON compliance.
    //
    // 4. FEATURE STATE MANAGEMENT: Mapbox's setFeatureState() requires matching IDs between the GeoJSON
    //    source and the feature selection. Without this transformation, feature highlighting and selection
    //    would fail completely.
    //
    // For detailed technical explanation of this problem and solution, see:
    // https://github.com/ConservationMetrics/gc-explorer/pull/109#issuecomment-2985123992
    // Reference: https://stackoverflow.com/questions/72040370/why-are-my-dataset-features-ids-undefined-in-mapbox-gl-while-i-have-set-them
    const feature: Feature = {
      type: "Feature",
      id: mapeoFeature.normalizedId || mapeoFeature.id, // Use normalized ID if available
      geometry: {
        type: geometryType,
        coordinates: JSON.parse(mapeoFeature.geocoordinates),
      } as Geometry,
      properties: {
        ...mapeoFeature,
      },
    };

    selectFeature(feature, "mapeo-data");
    isMapeo.value = true;

    // Zoom to the feature
    if (feature.geometry.type === "Point") {
      const [lng, lat] = feature.geometry.coordinates;
      map.value.flyTo({ center: [lng, lat], zoom: 13 });
    } else if (
      feature.geometry.type === "Polygon" ||
      feature.geometry.type === "MultiPolygon"
    ) {
      const bounds = bbox(feature);
      map.value.fitBounds(bounds, { padding: 50 });
    } else if (feature.geometry.type === "LineString") {
      const [lng, lat] = calculateLineStringCentroid(
        feature.geometry.coordinates,
      );
      map.value.flyTo({ center: [lng, lat], zoom: 13 });
    }
  }
};

onMounted(() => {
  mapboxgl.accessToken = props.mapboxAccessToken;
  map.value = new mapboxgl.Map({
    container: "map",
    style: props.mapboxStyle || "mapbox://styles/mapbox/streets-v12",
    projection: props.mapboxProjection || "mercator",
    center: [props.mapboxLongitude || 0, props.mapboxLatitude || -15],
    zoom: props.mapboxZoom || 2.5,
    pitch: props.mapboxPitch || 0,
    bearing: props.mapboxBearing || 0,
  });

  // @ts-expect-error: Expose map instance for Playwright E2E tests; not a standard property on window
  window._testMap = map.value;

  map.value.on("load", async () => {
    // Add 3D Terrain if set in env var
    if (props.mapbox3d) {
      map.value.addSource("mapbox-dem", {
        type: "raster-dem",
        url: "mapbox://mapbox.mapbox-terrain-dem-v1",
        tileSize: 512,
        maxzoom: 14,
      });
      map.value.setTerrain({ source: "mapbox-dem", exaggeration: 1.5 });
    }

    await prepareMapCanvasContent();

    // Navigation Control (zoom buttons and compass)
    const nav = new mapboxgl.NavigationControl();
    map.value.addControl(nav, "top-right");

    // Scale Control
    const scale = new mapboxgl.ScaleControl({
      maxWidth: 80,
      unit: "metric",
    });
    map.value.addControl(scale, "bottom-left");

    // Fullscreen Control
    const fullscreenControl = new mapboxgl.FullscreenControl();
    map.value.addControl(fullscreenControl, "top-right");

    // Ruler control
    const ruler = new rulerControl();
    map.value.addControl(ruler, "top-right");
    hasRulerControl.value = true;

    showBasemapSelector.value = true;

    dateOptions.value = getDateOptions();

    if (isOnlyLineStringData() !== true) {
      calculateHectares.value = true;
    }
    showSlider.value = true;

    // Check for alertId or mapeoDocId in URL and select the corresponding feature
    const alertId = route.query.alertId as string;
    const mapeoDocId = route.query.mapeoDocId as string;

    if (alertId) {
      selectInitialAlertFeature(alertId);
    } else if (mapeoDocId && props.mapeoData) {
      selectInitialMapeoFeature(mapeoDocId);
    }
  });
});

const emit = defineEmits(["reset-legend-visibility"]);

// ====================
// === Map Content ====
// ====================

// Add data to the map and set up event listeners
const featuresUnderCursor = ref(0);
const hasLineStrings = ref(false);
const hasPoints = ref(false);
const mapeoDataColor = ref();

/**
 * Adds alert data to the map by creating GeoJSON sources and layers for recent and previous alerts.
 * It checks for Polygon and LineString features and adds them to the map with appropriate styles.
 * Event listeners are added for user interactions with the alert features.
 */
const addAlertsData = async () => {
  const geoJsonSource = props.alertsData;
  /**
   * Adds a GeoJSON layer to the map for specified alert features and styles.
   * Type can be "Polygon" or "LineString".
   */
  const addAlertLayer = async (
    layerId: string,
    features: Feature[],
    type: string,
    fillColor: string | null,
    strokeColor: string | null,
  ): Promise<void> => {
    if (!features.some((feature) => feature.geometry.type === type)) return;

    if (!map.value.getSource(layerId)) {
      const baseConfig = {
        type: "geojson" as const,
        data: {
          type: "FeatureCollection" as const,
          features: features.filter(
            (feature) => feature.geometry.type === type,
          ),
        },
        minzoom: 10,
      };

      // Clustering for Point features
      const sourceConfig =
        type === "Point"
          ? {
              ...baseConfig,
              cluster: true,
              clusterMaxZoom: 14, // Max zoom level to cluster points
              clusterRadius: 100, // Radius of each cluster in pixels
            }
          : baseConfig;

      map.value.addSource(layerId, sourceConfig);
    }

    return new Promise((resolve) => {
      if (type === "Polygon" || type === "MultiPolygon") {
        if (!map.value.getLayer(layerId)) {
          map.value.addLayer({
            id: layerId,
            type: "fill",
            source: layerId,
            paint: {
              "fill-color": [
                "case",
                ["boolean", ["feature-state", "selected"], false],
                "#FFFF00",
                fillColor,
              ],
              "fill-opacity": 0.5,
            },
          });
        }

        if (!map.value.getLayer(`${layerId}-stroke`)) {
          map.value.addLayer({
            id: `${layerId}-stroke`,
            type: "line",
            source: layerId,
            paint: {
              "line-color": [
                "case",
                ["boolean", ["feature-state", "selected"], false],
                "#FFFF00",
                strokeColor,
              ],
              "line-width": 2,
            },
          });
        }
      }

      if (type === "LineString") {
        if (!map.value.getLayer(layerId)) {
          map.value.addLayer({
            id: layerId,
            type: "line",
            source: layerId,
            filter: ["==", "$type", "LineString"],
            paint: {
              "line-color": [
                "case",
                ["boolean", ["feature-state", "selected"], false],
                "#FFFF00",
                strokeColor,
              ],
              "line-width": [
                "case",
                ["boolean", ["feature-state", "selected"], false],
                5,
                3,
              ],
              "line-opacity": 0.8,
            },
          });
        }
      }

      if (type === "Point") {
        // Add cluster circle layer
        if (!map.value.getLayer(`${layerId}-clusters`)) {
          map.value.addLayer({
            id: `${layerId}-clusters`,
            type: "circle",
            source: layerId,
            filter: ["has", "point_count"],
            paint: {
              "circle-color": fillColor,
              "circle-radius": [
                "step",
                ["get", "point_count"],
                10, // radius for clusters with < 10 points
                10,
                20, // radius for clusters with 10-50 points
                50,
                30, // radius for clusters with 50+ points
              ],
              "circle-opacity": 0.8,
              "circle-stroke-width": 2,
              "circle-stroke-color": "#fff",
            },
          });
        }

        // Add cluster count label layer
        if (!map.value.getLayer(`${layerId}-cluster-count`)) {
          map.value.addLayer({
            id: `${layerId}-cluster-count`,
            type: "symbol",
            source: layerId,
            filter: ["has", "point_count"],
            layout: {
              "text-field": ["get", "point_count_abbreviated"],
              "text-font": ["DIN Offc Pro Medium", "Arial Unicode MS Bold"],
              "text-size": 12,
            },
            paint: {
              "text-color": "#ffffff",
            },
          });
        }

        // Add unclustered point layer
        if (!map.value.getLayer(layerId)) {
          map.value.addLayer({
            id: layerId,
            type: "circle",
            source: layerId,
            filter: ["!", ["has", "point_count"]], // Only show unclustered points
            paint: {
              "circle-color": [
                "case",
                ["boolean", ["feature-state", "selected"], false],
                "#FFFF00",
                fillColor,
              ],
              "circle-radius": [
                "case",
                ["boolean", ["feature-state", "selected"], false],
                10,
                5,
              ],
              "circle-opacity": 0.8,
            },
          });
        }
      }

      resolve();
    });
  };

  /**
   * Loads and adds an image to the style. Returns a promise that resolves
   * when the image is successfully loaded and added to the map.
   * Uses pixelRatio: 2 to ensure crisp rendering on high-DPI displays.
   */
  const loadMapImage = (iconName: string, iconUrl: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      map.value.loadImage(iconUrl, (error: Error, image: HTMLImageElement) => {
        if (error) {
          reject(error);
          return;
        }

        if (!map.value.hasImage(iconName)) {
          // Add image with pixelRatio: 2 for crisp rendering when scaled
          map.value.addImage(iconName, image, { pixelRatio: 2.5 });
        }
        resolve();
      });
    });
  };

  /**
   * Adds a GeoJSON point layer to the map using the geographicCentroid property,
   * with specified icon. Enables clustering for better performance.
   */
  const addAlertSymbolLayer = async (
    layerId: string,
    features: Feature[],
    iconName: string,
    iconUrl: string,
  ) => {
    await loadMapImage(iconName, iconUrl);

    if (!map.value.getSource(layerId)) {
      map.value.addSource(layerId, {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: features
            .filter((feature) => feature.properties?.geographicCentroid)
            .map((feature) => ({
              type: "Feature",
              geometry: {
                type: "Point",
                coordinates: feature.properties?.geographicCentroid
                  .split(",")
                  .map(Number)
                  .reverse(),
              },
              properties: {
                ...feature.properties,
              },
            })),
        },
        // Enable clustering for symbol layers
        cluster: true,
        clusterMaxZoom: 10, // Clusters break apart at zoom 10 (where symbols disappear)
        clusterRadius: 50,
      });
    }

    // Add cluster circle layer for symbols
    if (!map.value.getLayer(`${layerId}-clusters`)) {
      map.value.addLayer({
        id: `${layerId}-clusters`,
        type: "symbol",
        source: layerId,
        filter: ["has", "point_count"],
        layout: {
          "icon-image": iconName,
          "icon-size": [
            "step",
            ["get", "point_count"],
            2.0, // size for clusters with < 100 points (doubled for pixelRatio: 2)
            100,
            2.5, // size for clusters with 100-750 points
            750,
            3.0, // size for clusters with 750+ points
          ],
          "icon-allow-overlap": true,
        },
        maxzoom: 10,
      });
    }

    // Add cluster count label
    if (!map.value.getLayer(`${layerId}-cluster-count`)) {
      map.value.addLayer({
        id: `${layerId}-cluster-count`,
        type: "symbol",
        source: layerId,
        filter: ["has", "point_count"],
        layout: {
          "text-field": ["get", "point_count_abbreviated"],
          "text-font": ["DIN Offc Pro Medium", "Arial Unicode MS Bold"],
          "text-size": 16,
          "text-offset": [0, -2.0],
        },
        paint: {
          "text-color": "#000000",
          "text-halo-color": "#ffffff",
          "text-halo-width": 2,
        },
        maxzoom: 10,
      });
    }

    // Add unclustered symbol layer
    if (!map.value.getLayer(layerId)) {
      map.value.addLayer({
        id: layerId,
        type: "symbol",
        source: layerId,
        filter: ["!", ["has", "point_count"]], // Only show unclustered symbols
        layout: {
          "icon-image": iconName,
          "icon-size": 1.5,
          "icon-allow-overlap": true,
        },
        maxzoom: 10,
      });
    }
  };

  const orangeWarningIconUrl = new URL(
    "@/assets/icons/warning_orange.png",
    import.meta.url,
  ).href;
  const redWarningIconUrl = new URL(
    "@/assets/icons/warning_red.png",
    import.meta.url,
  ).href;

  await Promise.all([
    addAlertLayer(
      "previous-alerts-polygon",
      geoJsonSource.previousAlerts.features,
      "Polygon",
      "#FD8D3C",
      "#FD8D3C",
    ),
    addAlertLayer(
      "previous-alerts-linestring",
      geoJsonSource.previousAlerts.features,
      "LineString",
      null,
      "#FD8D3C",
    ),
    addAlertLayer(
      "previous-alerts-point",
      geoJsonSource.previousAlerts.features,
      "Point",
      "#FD8D3C",
      "#FD8D3C",
    ),
    addAlertSymbolLayer(
      "previous-alerts-symbol",
      geoJsonSource.previousAlerts.features,
      "warning-orange",
      orangeWarningIconUrl,
    ),
    addAlertLayer(
      "most-recent-alerts-polygon",
      geoJsonSource.mostRecentAlerts.features,
      "Polygon",
      "#FF0000",
      "#FF0000",
    ),
    addAlertLayer(
      "most-recent-alerts-linestring",
      geoJsonSource.mostRecentAlerts.features,
      "LineString",
      null,
      "#FF0000",
    ),
    addAlertLayer(
      "most-recent-alerts-point",
      geoJsonSource.mostRecentAlerts.features,
      "Point",
      "#FF0000",
      "#FF0000",
    ),
    addAlertSymbolLayer(
      "most-recent-alerts-symbol",
      geoJsonSource.mostRecentAlerts.features,
      "warning-red",
      redWarningIconUrl,
    ),
  ]);

  // Add event listeners only after all layers have loaded
  map.value.getStyle().layers.forEach((layer: Layer) => {
    if (
      (layer.id.startsWith("most-recent-alerts") &&
        !layer.id.includes("stroke")) ||
      (layer.id.startsWith("previous-alerts") && !layer.id.includes("stroke"))
    ) {
      map.value.on(
        "mouseenter",
        layer.id,
        () => {
          featuresUnderCursor.value++;
          map.value.getCanvas().style.cursor = "pointer";
        },
        { passive: true },
      );
      map.value.on(
        "mouseleave",
        layer.id,
        () => {
          featuresUnderCursor.value--;
          if (featuresUnderCursor.value === 0) {
            map.value.getCanvas().style.cursor = "";
          }
        },
        { passive: true },
      );
      map.value.on(
        "click",
        layer.id,
        (e: MapMouseEvent) => {
          if (e.features && e.features.length > 0) {
            const feature = e.features[0];
            if (layer.id.endsWith("symbol")) {
              if (feature.geometry.type === "Point") {
                const [lng, lat] = feature.geometry.coordinates;
                map.value.flyTo({ center: [lng, lat], zoom: 13 });
              }
            } else if (layer.id.endsWith("clusters")) {
              // Handle cluster clicks - zoom in to expand
              const clusterId = feature.properties?.cluster_id;
              const source = map.value.getSource(layer.source);
              if (source && clusterId !== undefined) {
                source.getClusterExpansionZoom(
                  clusterId,
                  (err: Error, zoom: number) => {
                    if (err) return;
                    if (feature.geometry.type === "Point") {
                      map.value.easeTo({
                        center: feature.geometry.coordinates,
                        zoom: zoom,
                      });
                    }
                  },
                );
              }
            } else {
              selectFeature(feature, layer.id);
            }
          }
        },
        { passive: true },
      );
    }
  });

  // Check mostRecentAlerts and previousAlerts for LineString features
  // If found, set hasLineStrings state to true to activate methods
  // relevant to lineStrings
  hasLineStrings.value =
    geoJsonSource.mostRecentAlerts.features.some(
      (feature) => feature.geometry.type === "LineString",
    ) ||
    geoJsonSource.previousAlerts.features.some(
      (feature) => feature.geometry.type === "LineString",
    );

  // Add buffer for LineStrings to make them easier to select
  if (hasLineStrings.value) {
    map.value.on("mousemove", handleBufferMouseEvent);
    map.value.on("click", handleBufferClick);
  }

  // Check mostRecentAlerts and previousAlerts for Point features
  // If found, set hasPoints state to true to activate methods
  // relevant to points
  hasPoints.value =
    geoJsonSource.mostRecentAlerts.features.some(
      (feature) => feature.geometry.type === "Point",
    ) ||
    geoJsonSource.previousAlerts.features.some(
      (feature) => feature.geometry.type === "Point",
    );

  // Add event listeners to update pulsing circles when map moves/zooms
  // This ensures we only show circles for currently visible features
  map.value.on("moveend", updatePulsingCirclesForViewport);
  map.value.on("zoomend", updatePulsingCirclesForViewport);
};

/**
 * Adds (optional) Mapeo data to the map by creating a GeoJSON source and a layer for Point features.
 * It also sets up event listeners for user interactions with the Mapeo data features.
 */
const addMapeoData = () => {
  if (!props.mapeoData) {
    return;
  }
  // Create a GeoJSON source with all the features
  const geoJsonSource = {
    type: "FeatureCollection",
    features: props.mapeoData.map((feature) => ({
      id: feature.normalizedId || feature.id, // Use normalized ID if available, fallback to original ID
      type: "Feature",
      geometry: {
        type: feature.geotype,
        coordinates: JSON.parse(feature.geocoordinates),
      },
      properties: {
        ...feature,
      },
    })),
  };

  mapeoDataColor.value = props.mapeoData[0]["filter-color"];

  // Add the source to the map
  if (!map.value.getSource("mapeo-data")) {
    map.value.addSource("mapeo-data", {
      type: "geojson",
      data: geoJsonSource,
    });
  }

  // Add a layer for Point features
  if (!map.value.getLayer("mapeo-data")) {
    map.value.addLayer({
      id: "mapeo-data",
      type: "circle",
      source: "mapeo-data",
      filter: ["==", "$type", "Point"],
      paint: {
        "circle-radius": 6,
        "circle-color": [
          // Use filter-color for fallback if selected is false
          "case",
          ["boolean", ["feature-state", "selected"], false],
          "#FFFF00",
          ["get", "filter-color"],
        ],
        "circle-stroke-width": 2,
        "circle-stroke-color": "#fff",
      },
    });
  }

  // Add event listeners
  ["mapeo-data"].forEach((layerId) => {
    map.value.on(
      "mouseenter",
      layerId,
      () => {
        featuresUnderCursor.value++;
        map.value.getCanvas().style.cursor = "pointer";
      },
      { passive: true },
    );
    map.value.on(
      "mouseleave",
      layerId,
      () => {
        featuresUnderCursor.value--;
        if (featuresUnderCursor.value === 0) {
          map.value.getCanvas().style.cursor = "";
        }
      },
      { passive: true },
    );
    map.value.on(
      "click",
      layerId,
      (e: MapMouseEvent) => {
        if (e.features && e.features.length > 0) {
          selectFeature(e.features[0], layerId);
        }
      },
      { passive: true },
    );
  });
};
/**
 * Prepares the map canvas content by adding alert and Mapeo data,
 * pulsing circles, and the map legend.
 */
const prepareMapCanvasContent = async () => {
  const promises = [];
  if (props.alertsData) {
    promises.push(addAlertsData());
  }
  if (props.mapeoData) {
    promises.push(addMapeoData());
  }
  await Promise.all(promises);

  // Use updatePulsingCirclesForViewport to ensure clean state
  updatePulsingCirclesForViewport();
  prepareMapLegendContent();
};

/* Checks if all features in the alerts data are of type LineString. */
const isOnlyLineStringData = () => {
  const allFeatures = [
    ...props.alertsData.mostRecentAlerts.features,
    ...props.alertsData.previousAlerts.features,
  ];
  return allFeatures.every((feature) => feature.geometry.type === "LineString");
};

/**
 * Handles click events on the map to select features within a buffer
 * around LineString features.
 */
const handleBufferClick = (e: MapMouseEvent) => {
  const pixelBuffer = 10;
  const bbox = [
    [e.point.x - pixelBuffer, e.point.y - pixelBuffer],
    [e.point.x + pixelBuffer, e.point.y + pixelBuffer],
  ];

  const features = map.value.queryRenderedFeatures(bbox, {
    layers: ["most-recent-alerts-linestring", "previous-alerts-linestring"],
  });

  if (features.length > 0) {
    const firstFeature = features[0];
    const layerId = firstFeature.layer.id;
    selectFeature(firstFeature, layerId);
  }
};

/**
 * Handles mouse movement events to change the cursor style when hovering
 * over LineString features within a buffer.
 */
const handleBufferMouseEvent = (e: MapMouseEvent) => {
  const pixelBuffer = 10;
  const bbox = [
    [e.point.x - pixelBuffer, e.point.y - pixelBuffer],
    [e.point.x + pixelBuffer, e.point.y + pixelBuffer],
  ];

  const layersToQuery = [
    "most-recent-alerts-linestring",
    "previous-alerts-linestring",
  ].filter((layerId) => map.value.getLayer(layerId));

  if (layersToQuery.length > 0) {
    const features = map.value.queryRenderedFeatures(bbox, {
      layers: layersToQuery,
    });

    if (features.length) {
      map.value.getCanvas().style.cursor = "pointer";
    } else if (featuresUnderCursor.value === 0) {
      map.value.getCanvas().style.cursor = "";
    }
  }
};

const pulsingCirclesAdded = ref(false);
const pulsingMarkers: { value: mapboxgl.Marker[] } = ref([]);
const MAX_PULSING_CIRCLES = 100; // Limit DOM markers for performance

/**
 * Updates pulsing circles based on currently visible features in the viewport.
 * This is called when the map moves or zooms to keep DOM markers optimized.
 */
const updatePulsingCirclesForViewport = () => {
  // Remove existing circles and re-add for current viewport
  removePulsingCircles();
  pulsingCirclesAdded.value = false; // Reset flag
  addPulsingCircles();
};

/**
 * Adds pulsing circles around the most recent alerts on the map.
 * The pulsing effect is based on the confidence level of the alerts.
 * Optimized to only show markers for visible features up to a maximum limit.
 */
const addPulsingCircles = () => {
  if (pulsingCirclesAdded.value) {
    return;
  }

  pulsingCirclesAdded.value = true;

  // Define the pulsing dot CSS
  const pulsingDot = document.createElement("div");
  pulsingDot.className = "pulsing-dot";

  // Add objects for different confidence levels
  const confidenceLevels = [
    { interval: "1", opacity: "1" },
    { interval: "0", opacity: "0.35" },
  ];

  // Add the CSS for the pulsing effect
  const styleSheet = document.createElement("style");
  styleSheet.type = "text/css";
  styleSheet.innerText = confidenceLevels
    .map(
      (level) => `
        @keyframes pulse-${level.interval} {
          0% { transform: scale(1); opacity: ${level.opacity}; }
          100% { transform: scale(1.5); opacity: 0; }
        }
        .pulsing-dot-${level.interval} {
          width: 30px;
          height: 30px;
          position: absolute;
          border-radius: 50%;
          pointer-events: none!important;
        }
        .pulsing-dot-${level.interval}::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          border: 5px solid #FF0000;
          border-radius: inherit;
          box-shadow: 0 0 0 2px #FF0000;
          animation: pulse-${level.interval} 2s infinite;
        }
      `,
    )
    .join("");
  document.head.appendChild(styleSheet);

  const addPulsingMarker = (feature: Feature) => {
    let lng, lat;

    if (
      feature.geometry.type === "Polygon" ||
      feature.geometry.type === "MultiPolygon"
    ) {
      // Calculate the center of the bounding box
      const bounds = bbox(feature);
      lng = (bounds[0] + bounds[2]) / 2;
      lat = (bounds[1] + bounds[3]) / 2;
    } else if (feature.geometry.type === "LineString") {
      // Use Turf to find the midpoint of the LineString
      [lng, lat] = calculateLineStringCentroid(feature.geometry.coordinates);
    } else if (feature.geometry.type === "Point") {
      [lng, lat] = feature.geometry.coordinates;
    } else {
      return;
    }

    // Determine the opacity based on confidenceLevel
    let confidenceInterval = "1";
    if (feature.properties && feature.properties.confidenceLevel === "0") {
      confidenceInterval = "0";
    }

    // Create a new marker and add it to the map
    const pulsingMarker = pulsingDot.cloneNode() as HTMLElement;
    pulsingMarker.classList.add(`pulsing-dot-${confidenceInterval}`);
    const marker = new mapboxgl.Marker(pulsingMarker);
    marker.setLngLat([lng, lat]).addTo(map.value);

    pulsingMarkers.value.push(marker);
  };

  // Query cluster features first - these are highest priority for pulsing
  const clusterFeatures = map.value.queryRenderedFeatures({
    layers: [
      "most-recent-alerts-point-clusters",
      "most-recent-alerts-symbol-clusters",
    ],
  });

  // If we have clusters, only show pulsing on clusters for clean visualization
  // If no clusters (zoomed in), show pulsing on individual features
  let allFeatures = clusterFeatures;

  if (clusterFeatures.length === 0) {
    // No clusters visible - we're zoomed in, so show unclustered features
    const unclusteredFeatures = map.value.queryRenderedFeatures({
      layers: [
        "most-recent-alerts-polygon",
        "most-recent-alerts-linestring",
        "most-recent-alerts-point",
        "most-recent-alerts-symbol",
      ],
    });
    allFeatures = unclusteredFeatures;
  }

  // Limit to MAX_PULSING_CIRCLES for performance
  const limitedFeatures = allFeatures.slice(0, MAX_PULSING_CIRCLES);

  // Add pulsing markers for visible features
  limitedFeatures.forEach(addPulsingMarker);
};

/** Removes pulsing circles from the map */
const removePulsingCircles = () => {
  // Remove all markers properly using Mapbox API
  pulsingMarkers.value.forEach((marker) => marker.remove());
  pulsingMarkers.value = [];

  // Fallback: clean up any remaining DOM elements
  document.querySelectorAll(".pulsing-dot").forEach((el) => el.remove());
  pulsingCirclesAdded.value = false;
};

/** Handles the change of the basemap style */
const currentBasemap = ref<Basemap>({ id: "custom", style: props.mapboxStyle });
const handleBasemapChange = (newBasemap: Basemap) => {
  removePulsingCircles();
  changeMapStyle(map.value, newBasemap, props.planetApiKey);

  currentBasemap.value = newBasemap;

  // Once map is idle, re-add sources, layers, and event listeners
  map.value.once("idle", () => {
    prepareMapCanvasContent();
  });
};

/** Prepares the map legend content based on available layers */
const mapLegendContent = ref();
const prepareMapLegendContent = () => {
  map.value.once("idle", () => {
    const legendItems: MapLegendItem[] = [];

    // Add most recent alerts as a single grouped entry
    if (props.alertsData.mostRecentAlerts.features.length > 0) {
      legendItems.push({
        id: "most-recent-alerts",
        name: "Most recent alerts",
        type: "symbol", // Use symbol type to display warning icon
        color: "#FF0000",
        visible: true,
        iconUrl: new URL("@/assets/icons/warning_red.png", import.meta.url)
          .href,
      });
    }

    // Add previous alerts as a single grouped entry
    if (props.alertsData.previousAlerts.features.length > 0) {
      legendItems.push({
        id: "previous-alerts",
        name: "Previous alerts",
        type: "symbol", // Use symbol type to display warning icon
        color: "#FD8D3C",
        visible: true,
        iconUrl: new URL("@/assets/icons/warning_orange.png", import.meta.url)
          .href,
      });
    }

    // Add mapeo-data layer to mapLegendContent
    if (props.mapeoData) {
      legendItems.push({
        id: "mapeo-data",
        name: "Mapeo data",
        type: "circle",
        color: mapeoDataColor.value || "#000000",
        visible: true,
      });
    }

    // Add any additional layers from props.mapLegendLayerIds
    if (props.mapLegendLayerIds) {
      const additionalLayers = prepareMapLegendLayers(
        map.value,
        props.mapLegendLayerIds,
        mapeoDataColor.value,
      );
      if (additionalLayers) {
        legendItems.push(...(additionalLayers as MapLegendItem[]));
      }
    }

    mapLegendContent.value = legendItems;
  });
};

/**
 * Toggles the visibility of a map layer or all related layers for alert groups.
 * For alert layers, toggles all geometry types and symbol layers together.
 * For most-recent-alerts, also toggles pulsing circles.
 */
const toggleLayerVisibility = (item: MapLegendItem) => {
  const visibility = item.visible ? "visible" : "none";

  // Handle alert group layers - toggle all related layers
  if (item.id === "most-recent-alerts" || item.id === "previous-alerts") {
    const layerPrefix = item.id;
    const layerTypes = ["polygon", "linestring", "point", "symbol"];

    layerTypes.forEach((type) => {
      const layerId = `${layerPrefix}-${type}`;
      if (map.value.getLayer(layerId)) {
        map.value.setLayoutProperty(layerId, "visibility", visibility);
      }

      // Handle stroke layers for polygons
      if (type === "polygon") {
        const strokeLayerId = `${layerId}-stroke`;
        if (map.value.getLayer(strokeLayerId)) {
          map.value.setLayoutProperty(strokeLayerId, "visibility", visibility);
        }
      }

      // Handle cluster layers for points
      if (type === "point") {
        const clusterLayerId = `${layerId}-clusters`;
        const clusterCountLayerId = `${layerId}-cluster-count`;
        if (map.value.getLayer(clusterLayerId)) {
          map.value.setLayoutProperty(clusterLayerId, "visibility", visibility);
        }
        if (map.value.getLayer(clusterCountLayerId)) {
          map.value.setLayoutProperty(
            clusterCountLayerId,
            "visibility",
            visibility,
          );
        }
      }

      // Handle cluster layers for symbols
      if (type === "symbol") {
        const clusterLayerId = `${layerId}-clusters`;
        const clusterCountLayerId = `${layerId}-cluster-count`;
        if (map.value.getLayer(clusterLayerId)) {
          map.value.setLayoutProperty(clusterLayerId, "visibility", visibility);
        }
        if (map.value.getLayer(clusterCountLayerId)) {
          map.value.setLayoutProperty(
            clusterCountLayerId,
            "visibility",
            visibility,
          );
        }
      }
    });

    // Handle pulsing circles for most-recent-alerts
    if (item.id === "most-recent-alerts") {
      if (item.visible) {
        // Layer is being made visible - update pulsing circles for current viewport
        updatePulsingCirclesForViewport();
      } else {
        // Layer is being hidden - remove pulsing circles
        removePulsingCircles();
      }
    }
  } else {
    // Handle individual layers (mapeo-data, etc.)
    utilsToggleLayerVisibility(map.value, item);
  }
};

// ========================
// === Sidebar Content ====
// ========================

const selectedDateRange = ref();
/**
 * Converts date strings from "MM-YYYY" format to "YYYYMM" format for comparison.
 * If the start or end date is "earlier", it substitutes with the earliest or twelve months before date.
 */
const convertDates = (start: string, end: string) => {
  const convertToDate = (dateStr: string) => {
    const [month, year] = dateStr.split("-").map(Number);
    return (year * 100 + month).toString();
  };

  if (start === t("earlier")) {
    start = props.alertsStatistics.earliestAlertsDate;
  }

  if (end === t("earlier")) {
    end = props.alertsStatistics.twelveMonthsBefore;
  }

  const startDate = convertToDate(start);
  const endDate = convertToDate(end);

  return [startDate, endDate];
};

/**
 * Retrieves date options for selection, replacing earlier dates with "Earlier" if there are more than 12 dates.
 * @returns {string[]} - An array of date options.
 */
const getDateOptions = () => {
  let dates = props.alertsStatistics.allDates;

  if (dates.length > 12) {
    const last12Dates = dates.slice(-12);
    dates = [t("earlier"), ...last12Dates];
  }

  return dates;
};

/**
 * Handles changes in the selected date range, updating map layers to show features within the new range.
 * @param {[string, string]} newRange - The new date range as an array of start and end dates.
 */
const handleDateRangeChanged = (newRange: [string, string]) => {
  // Extract start and end dates from newRange
  let [start, end] = newRange;

  if (start === t("earlier")) {
    start = props.alertsStatistics.earliestAlertsDate;
  }

  if (end === t("earlier")) {
    end = props.alertsStatistics.twelveMonthsBefore;
  }

  const [startDate, endDate] = convertDates(start, end);

  // Update the layers to only show features within the selected date range
  nextTick(() => {
    map.value.getStyle().layers.forEach((layer: Layer) => {
      if (
        (layer.id.startsWith("most-recent-alerts") ||
          layer.id.startsWith("previous-alerts")) &&
        // CRITICAL: Don't apply filters to cluster layers - they don't have feature properties
        !layer.id.includes("-cluster")
      ) {
        // For point and symbol layers, combine date filter with cluster exclusion filter
        // For other layers (polygon, linestring), just use date filter
        const dateFilter = [
          "all",
          [">=", ["get", "YYYYMM"], startDate],
          ["<=", ["get", "YYYYMM"], endDate],
        ];

        if (layer.id.endsWith("-point") || layer.id.endsWith("-symbol")) {
          // Point and symbol layers need to exclude clustered items
          map.value.setFilter(layer.id, [
            "all",
            dateFilter,
            ["!", ["has", "point_count"]], // Exclude clustered items
          ]);
        } else {
          map.value.setFilter(layer.id, dateFilter);
        }
      }
    });

    // If 'most-recent-alerts' layers are empty, remove the pulsing circles. If not, add them.
    const recentAlertsLayers = map.value
      .getStyle()
      .layers.filter((layer: Layer) =>
        layer.id.startsWith("most-recent-alerts"),
      );
    const recentAlertsFeatures = [];
    recentAlertsLayers.forEach((layer: Layer) => {
      recentAlertsFeatures.push(
        ...map.value.querySourceFeatures(layer.source, {
          sourceLayer: layer["source-layer"],
          filter: [
            "all",
            [">=", ["get", "YYYYMM"], startDate],
            ["<=", ["get", "YYYYMM"], endDate],
          ],
        }),
      );
    });

    if (recentAlertsFeatures.length > 0) {
      updatePulsingCirclesForViewport();
    } else {
      removePulsingCircles();
    }

    // Update the selected date range
    selectedDateRange.value = newRange;

    // Update localAlertsData to match the data with the selected date range
    localAlertsData.value = filteredData.value;
  });
};

/* Closes the sidebar and resets the selected feature. */
const handleSidebarClose = () => {
  showSidebar.value = false;
  resetSelectedFeature();
};

/**
 * Computes filtered data based on the selected date range.
 * If no date range is selected, returns the full alerts data.
 * @returns {Object} - The filtered alerts data.
 */
const filteredData = computed(() => {
  if (!selectedDateRange.value) {
    return props.alertsData;
  }

  const [start, end] = selectedDateRange.value;
  const [startDate, endDate] = convertDates(start, end);

  const filterFeatures = (features: Feature[]) => {
    return features.filter((feature) => {
      const monthDetected = feature.properties
        ? feature.properties["YYYYMM"]
        : null;
      return monthDetected >= startDate && monthDetected <= endDate;
    });
  };

  return {
    mostRecentAlerts: {
      ...props.alertsData.mostRecentAlerts,
      features: filterFeatures(props.alertsData.mostRecentAlerts.features),
    },
    previousAlerts: {
      ...props.alertsData.previousAlerts,
      features: filterFeatures(props.alertsData.previousAlerts.features),
    },
  };
});

// ===========================================
// === Methods for selecting and resetting ===
// ===========================================

const imageCaption = ref();
const imageUrl = ref();
const isAlert = ref(false);
const selectedFeature = ref();
const selectedFeatureId = ref();
const selectedFeatureSource = ref();
/**
 * Selects a feature on the map, updating the component state and UI.
 * Resets any previously selected feature and highlights the new one.
 * Updates the sidebar with feature details and manages image URLs.
 *
 * @param {Feature} feature - The feature to be selected.
 * @param {string} layerId - The ID of the layer containing the feature.
 */
const selectFeature = (feature: Feature, layerId: string) => {
  if (!feature.properties) {
    return;
  }
  const featureObject = feature.properties;

  const featureGeojson = {
    type: feature.type,
    geometry: feature.geometry,
    properties: feature.properties,
  };
  const featureId = feature.id;

  // Update URL with alertId or mapeoDocId
  const query = { ...route.query };
  // Remove any existing feature IDs first
  delete query.alertId;
  delete query.mapeoDocId;

  // Add the new feature ID
  if (featureObject.alertID) {
    query.alertId = featureObject.alertID;
    isMapeo.value = false;
  } else if (featureObject.id) {
    query.mapeoDocId = featureObject.id;
    isMapeo.value = true;
  }

  router.replace({ query });

  // Reset the previously selected feature
  if (selectedFeatureId.value !== null && selectedFeatureSource.value) {
    map.value.setFeatureState(
      {
        source: selectedFeatureSource.value,
        id: selectedFeatureId.value,
      },
      { selected: false },
    );
  }

  // Set new feature state
  map.value.setFeatureState(
    { source: layerId, id: featureId },
    { selected: true },
  );

  delete featureObject["YYYYMM"];

  // Update component state
  localAlertsData.value = featureGeojson;
  selectedFeature.value = featureObject;
  selectedFeatureId.value = featureId;
  selectedFeatureSource.value = layerId;
  showSidebar.value = true;
  showIntroPanel.value = false;

  if (featureObject["alertID"]) {
    isAlert.value = true;
  } else {
    isAlert.value = false;
  }

  // The following code handles deletions or rewrites of certain properties
  // for the selected feature to prepare it for display in the sidebar.

  // Columns that may or may not exist, depending on views config
  imageUrl.value = [];
  if (featureObject.t0_url) {
    imageUrl.value.push(featureObject.t0_url);
  }
  if (featureObject.t1_url) {
    imageUrl.value.push(featureObject.t1_url);
  }
  if (featureObject["photos"]) {
    const photos = featureObject["photos"].split(",");
    photos.forEach((photo: string) => imageUrl.value.push(photo.trim()));
  }

  delete featureObject["t0_url"];
  delete featureObject["t1_url"];
  delete featureObject["filter-color"];
  delete featureObject["normalizedId"];

  // Rewrite coordinates string from [long, lat] to lat, long, removing brackets
  if (featureObject.geocoordinates) {
    featureObject.geocoordinates = prepareCoordinatesForSelectedFeature(
      featureObject.geocoordinates,
    );
  }

  removePulsingCircles();
};

/**
 * Resets the currently selected feature, clearing its state and UI highlights.
 */
const resetSelectedFeature = () => {
  if (selectedFeatureId.value === null || !selectedFeatureSource.value) {
    return;
  }
  map.value.setFeatureState(
    { source: selectedFeatureSource.value, id: selectedFeatureId.value },
    { selected: false },
  );
  localAlertsData.value = props.alertsData;
  selectedFeature.value = null;
  selectedFeatureId.value = null;
  selectedFeatureSource.value = null;

  // Remove alertId and isRecent from URL when resetting
  const query = { ...route.query };
  delete query.alertId;
  delete query.isRecent;
  router.replace({ query });
};

/**
 * Resets the map and UI to their initial states, clearing selections and filters.
 * Repositions the map to its initial view and re-adds pulsing circles.
 */
const resetToInitialState = () => {
  resetSelectedFeature();
  localAlertsData.value = props.alertsData;
  showSidebar.value = true;
  showIntroPanel.value = true;
  imageUrl.value = [];
  imageCaption.value = null;
  selectedDateRange.value = null;

  // Reset the filters for layers that start with 'most-recent-alerts' and 'alerts'
  // Skip cluster layers as they don't have filters applied
  map.value.getStyle().layers.forEach((layer: Layer) => {
    if (
      (layer.id.startsWith("most-recent-alerts") ||
        layer.id.startsWith("alerts")) &&
      !layer.id.includes("-cluster")
    ) {
      // Point and symbol layers need to restore their cluster exclusion filter
      if (layer.id.endsWith("-point") || layer.id.endsWith("-symbol")) {
        map.value.setFilter(layer.id, ["!", ["has", "point_count"]]);
      } else {
        map.value.setFilter(layer.id, null);
      }
    }
  });

  // First, fly to the initial position
  map.value.flyTo({
    center: [props.mapboxLongitude || 0, props.mapboxLatitude || -15],
    zoom: props.mapboxZoom || 2.5,
    pitch: props.mapboxPitch || 0,
    bearing: props.mapboxBearing || 0,
  });

  // After map movement is complete, reset visibility and add pulsing circles
  map.value.once("idle", () => {
    // Reset legend visibility state
    mapLegendContent.value = mapLegendContent.value.map(
      (item: MapLegendItem) => ({
        ...item,
        visible: true,
      }),
    );

    // Make all layers visible (without triggering pulsing circle updates yet)
    mapLegendContent.value.forEach((item: MapLegendItem) => {
      const visibility = "visible";

      // Handle alert group layers
      if (item.id === "most-recent-alerts" || item.id === "previous-alerts") {
        const layerPrefix = item.id;
        const layerTypes = ["polygon", "linestring", "point", "symbol"];

        layerTypes.forEach((type) => {
          const layerId = `${layerPrefix}-${type}`;
          if (map.value.getLayer(layerId)) {
            map.value.setLayoutProperty(layerId, "visibility", visibility);
          }

          // Handle stroke layers for polygons
          if (type === "polygon") {
            const strokeLayerId = `${layerId}-stroke`;
            if (map.value.getLayer(strokeLayerId)) {
              map.value.setLayoutProperty(
                strokeLayerId,
                "visibility",
                visibility,
              );
            }
          }

          // Handle cluster layers for points
          if (type === "point") {
            const clusterLayerId = `${layerId}-clusters`;
            const clusterCountLayerId = `${layerId}-cluster-count`;
            if (map.value.getLayer(clusterLayerId)) {
              map.value.setLayoutProperty(
                clusterLayerId,
                "visibility",
                visibility,
              );
            }
            if (map.value.getLayer(clusterCountLayerId)) {
              map.value.setLayoutProperty(
                clusterCountLayerId,
                "visibility",
                visibility,
              );
            }
          }

          // Handle cluster layers for symbols
          if (type === "symbol") {
            const clusterLayerId = `${layerId}-clusters`;
            const clusterCountLayerId = `${layerId}-cluster-count`;
            if (map.value.getLayer(clusterLayerId)) {
              map.value.setLayoutProperty(
                clusterLayerId,
                "visibility",
                visibility,
              );
            }
            if (map.value.getLayer(clusterCountLayerId)) {
              map.value.setLayoutProperty(
                clusterCountLayerId,
                "visibility",
                visibility,
              );
            }
          }
        });
      } else {
        // Handle individual layers (mapeo-data, etc.)
        utilsToggleLayerVisibility(map.value, item);
      }
    });

    emit("reset-legend-visibility");

    // Finally, add pulsing circles now that everything is in the right state
    updatePulsingCirclesForViewport();
  });
};

const calculateLineStringCentroid = (coordinates: number[][]) => {
  const line = lineString(coordinates);
  const lineLength = length(line, { units: "kilometers" });
  const midpoint = along(line, lineLength / 2, { units: "kilometers" });
  return midpoint.geometry.coordinates;
};

onBeforeUnmount(() => {
  if (map.value) {
    map.value.remove();
  }
});
</script>

<template>
  <div>
    <div id="map"></div>
    <button
      v-if="!showSidebar"
      class="reset-button bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline mx-2"
      @click="resetToInitialState"
    >
      {{ $t("resetDashboard") }}
    </button>
    <ViewSidebar
      :alerts-statistics="alertsStatistics"
      :allowed-file-extensions="allowedFileExtensions"
      :calculate-hectares="calculateHectares"
      :date-options="dateOptions"
      :feature="selectedFeature"
      :feature-geojson="localAlertsData"
      :file-paths="imageUrl"
      :geojson-selection="filteredData"
      :is-alert="isAlert"
      :is-mapeo="isMapeo"
      :is-alerts-dashboard="true"
      :local-alerts-data="localAlertsData"
      :logo-url="logoUrl"
      :media-base-path="mediaBasePath"
      :media-base-path-alerts="mediaBasePathAlerts"
      :show-intro-panel="showIntroPanel"
      :show-sidebar="showSidebar"
      :show-slider="showSlider"
      @close="handleSidebarClose"
      @date-range-changed="handleDateRangeChanged"
    />
    <MapLegend
      v-if="mapLegendContent && alertsData"
      :map-legend-content="mapLegendContent"
      @toggle-layer-visibility="toggleLayerVisibility"
    />
    <BasemapSelector
      v-if="showBasemapSelector"
      :has-ruler-control="hasRulerControl"
      :mapbox-style="mapboxStyle"
      :planet-api-key="planetApiKey"
      @basemap-selected="handleBasemapChange"
    />
  </div>
</template>

<style scoped>
body {
  margin: 0;
  padding: 0;
}

#map {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 100%;
}

.mapboxgl-popup-content {
  word-wrap: break-word;
}

:deep(.mapboxgl-ctrl-ruler) {
  img {
    margin-left: 3px;
  }

  .active {
    background-color: #fff44f;
  }
}

.popup-media {
  width: 100%;
  display: block;
  margin-top: 5px;
}

.reset-button {
  position: absolute;
  top: 10px;
  left: 10px;
  z-index: 10;
}
</style>
