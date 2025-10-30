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
  mapbox3dTerrainExaggeration: number;
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
    // Check if feature exists in recent layer
    const isInRecentLayer = props.alertsData.mostRecentAlerts.features.some(
      (f) => f.properties?.alertID === feature.properties?.alertID,
    );

    // Determine the correct layer based on geometry type
    let layerId: string;
    const geometryType = feature.geometry.type;

    if (geometryType === "Point") {
      // Point features use the point layer
      layerId = isInRecentLayer
        ? "most-recent-alerts-point"
        : "previous-alerts-point";
    } else {
      // Polygon/LineString features use the geometry-specific layer
      // (not centroids, since we'll be zooming in to show the actual geometry)
      layerId = isInRecentLayer
        ? `most-recent-alerts-${geometryType.toLowerCase()}`
        : `previous-alerts-${geometryType.toLowerCase()}`;
    }

    selectFeature(feature, layerId);

    // Zoom to the feature
    // Use zoom 15 (above clusterMaxZoom of 14) to ensure individual features are visible
    // For polygons/linestrings, ensure we're at least at GEOMETRY_MIN_ZOOM (12) to show actual geometry
    if (feature.geometry.type === "Point") {
      const [lng, lat] = feature.geometry.coordinates;
      map.value.flyTo({ center: [lng, lat], zoom: 15 });
    } else if (
      feature.geometry.type === "Polygon" ||
      feature.geometry.type === "MultiPolygon"
    ) {
      const bounds = bbox(feature);
      map.value.fitBounds(bounds, { padding: 50, minZoom: 12 });
    } else if (feature.geometry.type === "LineString") {
      const [lng, lat] = calculateLineStringCentroid(
        feature.geometry.coordinates,
      );
      map.value.flyTo({ center: [lng, lat], zoom: 15 });
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
      map.value.setTerrain({
        source: "mapbox-dem",
        exaggeration: props.mapbox3dTerrainExaggeration,
      });
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
    // Wait for map to be idle (fully rendered) before selecting
    const alertId = route.query.alertId as string;
    const mapeoDocId = route.query.mapeoDocId as string;

    if (alertId || mapeoDocId) {
      map.value.once("idle", () => {
        if (alertId) {
          selectInitialAlertFeature(alertId);
        } else if (mapeoDocId && props.mapeoData) {
          selectInitialMapeoFeature(mapeoDocId);
        }
      });
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
      };

      // Clustering for Point features
      // See https://docs.mapbox.com/mapbox-gl-js/example/cluster/
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
      // Zoom threshold: below this, show centroid circles; at/above this, show actual geometries
      const GEOMETRY_MIN_ZOOM = 12;

      if (type === "Polygon" || type === "MultiPolygon") {
        if (!map.value.getLayer(layerId)) {
          map.value.addLayer({
            id: layerId,
            type: "fill",
            source: layerId,
            minzoom: GEOMETRY_MIN_ZOOM, // Only show actual polygons when zoomed in
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
            minzoom: GEOMETRY_MIN_ZOOM, // Only show actual polygon strokes when zoomed in
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
            minzoom: GEOMETRY_MIN_ZOOM, // Only show actual linestrings when zoomed in
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
              "circle-color": fillColor, // Will be dynamically updated by updateClusterHighlight()
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
   * Adds clustered circle layers for Polygon/LineString centroids.
   * Uses the geographicCentroid property to create Point features that can be clustered.
   */
  const addCentroidCircleLayer = async (
    layerId: string,
    features: Feature[],
    color: string,
  ) => {
    // Filter features that have centroids (Polygons and LineStrings ONLY, exclude Points!)
    const centroidFeatures = features
      .filter(
        (feature) =>
          feature.properties?.geographicCentroid &&
          feature.geometry.type !== "Point", // Exclude Point features - they have their own layer
      )
      .map((feature) => ({
        type: "Feature" as const,
        geometry: {
          type: "Point" as const,
          coordinates: feature.properties?.geographicCentroid
            .split(",")
            .map(Number)
            .reverse(),
        },
        properties: {
          ...feature.properties,
        },
      }));

    if (centroidFeatures.length === 0) return;

    // Add source with clustering enabled
    if (!map.value.getSource(layerId)) {
      map.value.addSource(layerId, {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: centroidFeatures,
        },
        cluster: true,
        clusterMaxZoom: 14,
        clusterRadius: 50,
        promoteId: "alertID", // Use alertID as the feature ID for feature-state on individual points
      });
    }

    // Zoom threshold: centroid circles only show below zoom 12
    // At zoom 12+, actual polygon/linestring geometries show instead
    const CENTROID_MAX_ZOOM = 11;

    // Add cluster circle layer
    if (!map.value.getLayer(`${layerId}-clusters`)) {
      map.value.addLayer({
        id: `${layerId}-clusters`,
        type: "circle",
        source: layerId,
        filter: ["has", "point_count"],
        maxzoom: CENTROID_MAX_ZOOM + 1, // Hide at zoom 12+
        paint: {
          "circle-color": color, // Will be dynamically updated by updateClusterHighlight()
          "circle-radius": ["step", ["get", "point_count"], 15, 10, 25, 50, 35],
          "circle-opacity": 0.8,
          "circle-stroke-width": 2,
          "circle-stroke-color": "#fff",
        },
      });
    }

    // Add cluster count label
    if (!map.value.getLayer(`${layerId}-cluster-count`)) {
      map.value.addLayer({
        id: `${layerId}-cluster-count`,
        type: "symbol",
        source: layerId,
        filter: ["has", "point_count"],
        maxzoom: CENTROID_MAX_ZOOM + 1, // Hide at zoom 12+
        layout: {
          "text-field": ["get", "point_count_abbreviated"],
          "text-font": ["DIN Offc Pro Medium", "Arial Unicode MS Bold"],
          "text-size": 14,
        },
        paint: {
          "text-color": "#ffffff",
        },
      });
    }

    // Add unclustered circle layer
    if (!map.value.getLayer(layerId)) {
      map.value.addLayer({
        id: layerId,
        type: "circle",
        source: layerId,
        filter: ["!", ["has", "point_count"]],
        maxzoom: CENTROID_MAX_ZOOM + 1, // Hide at zoom 12+
        paint: {
          "circle-color": [
            "case",
            ["boolean", ["feature-state", "selected"], false],
            "#FFFF00",
            color,
          ],
          "circle-radius": [
            "case",
            ["boolean", ["feature-state", "selected"], false],
            12,
            8,
          ],
          "circle-opacity": 0.8,
          "circle-stroke-width": 2,
          "circle-stroke-color": "#fff",
        },
      });
    }
  };

  await Promise.all([
    // Previous alerts - original geometry layers
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
    // Previous alerts - centroid circles for Polygon/LineString
    addCentroidCircleLayer(
      "previous-alerts-centroids",
      geoJsonSource.previousAlerts.features,
      "#FD8D3C",
    ),

    // Most recent alerts - original geometry layers
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
    // Most recent alerts - centroid circles for Polygon/LineString
    addCentroidCircleLayer(
      "most-recent-alerts-centroids",
      geoJsonSource.mostRecentAlerts.features,
      "#FF0000",
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

            // Check if this is a cluster feature (either by layer name or properties)
            if (
              layer.id.endsWith("clusters") ||
              feature.properties?.cluster ||
              feature.properties?.cluster_id !== undefined
            ) {
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
              // Only select non-cluster features
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

  // Update cluster highlighting when zoom/pan changes
  map.value.on("zoomend", () => {
    // Re-highlight cluster if a feature is selected (after a brief delay)
    if (
      selectedFeature.value &&
      selectedFeatureGeometry.value &&
      selectedFeatureSource.value
    ) {
      setTimeout(() => {
        highlightClusterContainingFeature(selectedFeatureSource.value);
      }, 100);
    }
  });
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
 * and the map legend.
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

/** Handles the change of the basemap style */
const currentBasemap = ref<Basemap>({ id: "custom", style: props.mapboxStyle });
const handleBasemapChange = (newBasemap: Basemap) => {
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
        type: "circle",
        color: "#FF0000",
        visible: true,
      });
    }

    // Add previous alerts as a single grouped entry
    if (props.alertsData.previousAlerts.features.length > 0) {
      legendItems.push({
        id: "previous-alerts",
        name: "Previous alerts",
        type: "circle",
        color: "#FD8D3C",
        visible: true,
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
 */
const toggleLayerVisibility = (item: MapLegendItem) => {
  const visibility = item.visible ? "visible" : "none";

  // Handle alert group layers - toggle all related layers
  if (item.id === "most-recent-alerts" || item.id === "previous-alerts") {
    const layerPrefix = item.id;
    const layerTypes = ["polygon", "linestring", "point", "centroids"];

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

      // Handle cluster layers for points and centroids
      if (type === "point" || type === "centroids") {
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
        // Don't apply filters to cluster layers - they don't have feature properties
        !layer.id.includes("-cluster")
      ) {
        // For point and symbol layers, combine date filter with cluster exclusion filter
        // For other layers (polygon, linestring), just use date filter
        const dateFilter = [
          "all",
          [">=", ["get", "YYYYMM"], startDate],
          ["<=", ["get", "YYYYMM"], endDate],
        ];

        if (layer.id.endsWith("-point") || layer.id.endsWith("-centroids")) {
          // Point and centroid layers need to exclude clustered items
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
const selectedFeatureGeometry = ref(); // Store geometry separately for cluster highlighting
const selectedClusterId = ref<number | string | null>(null);
const selectedClusterSource = ref<string | null>(null);

/**
 * Gets the companion layer ID for polygon/linestring features.
 * Companion layers are geometry ↔ centroid pairs that represent the same features at different zoom levels.
 * @param layerId - The current layer ID
 * @param featureAlertId - Optional alertID to help determine the correct geometry type for centroids
 * @returns The companion layer ID, or null if no companion exists
 */
const getCompanionLayerId = (
  layerId: string,
  featureAlertId?: string,
): string | null => {
  // Map geometry layers to their centroid companions
  if (
    layerId.includes("-polygon") ||
    layerId.includes("-linestring") ||
    layerId.includes("-multipolygon")
  ) {
    const prefix = layerId.replace(/-polygon|-linestring|-multipolygon/i, "");
    return `${prefix}-centroids`;
  }

  // Map centroid layers to their geometry companions
  // Need to determine which geometry type by checking the original feature
  if (layerId.includes("-centroids") && featureAlertId) {
    const prefix = layerId.replace("-centroids", "");
    const possibleLayers = [
      `${prefix}-polygon`,
      `${prefix}-linestring`,
      `${prefix}-multipolygon`,
    ];

    // Check each possible geometry source to find which one has this feature
    for (const possibleLayer of possibleLayers) {
      const source = map.value.getSource(
        possibleLayer,
      ) as mapboxgl.GeoJSONSource;
      if (source && source.type === "geojson") {
        const sourceData = (
          source as mapboxgl.GeoJSONSource & {
            _data?: { features?: Feature[] };
          }
        )._data;
        if (sourceData?.features) {
          const hasFeature = sourceData.features.some(
            (f) => f.properties?.alertID === featureAlertId,
          );
          if (hasFeature) {
            return possibleLayer;
          }
        }
      }
    }
  }

  return null;
};

/**
 * Updates cluster layer styling to highlight the selected cluster.
 * Uses setPaintProperty with a data-driven expression since clusters don't have stable feature IDs.
 */
const updateClusterHighlight = () => {
  if (!map.value) return;

  // List of all cluster layer IDs that need updating
  const clusterLayers = [
    {
      clustersLayer: "most-recent-alerts-centroids-clusters",
      source: "most-recent-alerts-centroids",
      color: "#FF0000",
    },
    {
      clustersLayer: "most-recent-alerts-point-clusters",
      source: "most-recent-alerts-point",
      color: "#FF0000",
    },
    {
      clustersLayer: "previous-alerts-centroids-clusters",
      source: "previous-alerts-centroids",
      color: "#FD8D3C",
    },
    {
      clustersLayer: "previous-alerts-point-clusters",
      source: "previous-alerts-point",
      color: "#FD8D3C",
    },
  ];

  clusterLayers.forEach(({ clustersLayer, source, color }) => {
    if (map.value.getLayer(clustersLayer)) {
      // Update cluster color based on whether this cluster is selected
      const paintExpression =
        selectedClusterId.value !== null &&
        selectedClusterSource.value === source
          ? [
              "case",
              ["==", ["get", "cluster_id"], selectedClusterId.value],
              "#FFFF00", // Yellow if this is the selected cluster
              color, // Default color otherwise
            ]
          : color; // No cluster selected, use default color

      map.value.setPaintProperty(
        clustersLayer,
        "circle-color",
        paintExpression,
      );
    }
  });
};

/**
 * Highlights a cluster that contains the selected feature (if any).
 * This makes the cluster turn yellow when zoomed out.
 */
const highlightClusterContainingFeature = async (selectedLayerId: string) => {
  if (!selectedFeatureGeometry.value || !selectedFeature.value) {
    return;
  }

  // Get the alertID of the selected feature
  const selectedAlertId = selectedFeature.value.alertID;
  if (!selectedAlertId) {
    return; // Can't match without an ID
  }

  // Track the previous cluster to avoid redundant updates
  const prevClusterId = selectedClusterId.value;
  const prevClusterSource = selectedClusterSource.value;

  // Determine which cluster layer to check (only check the one source we need)
  let clusterLayerName: string;
  let sourceName: string;

  if (selectedLayerId.includes("-point")) {
    sourceName = selectedLayerId;
    clusterLayerName = `${selectedLayerId}-clusters`;
  } else if (selectedLayerId.includes("-centroids")) {
    sourceName = selectedLayerId;
    clusterLayerName = `${selectedLayerId}-clusters`;
  } else {
    // For other geometry types, check the corresponding centroids layer
    const prefix = selectedLayerId.replace(
      /-polygon|-linestring|-multipolygon/i,
      "",
    );
    sourceName = `${prefix}-centroids`;
    clusterLayerName = `${prefix}-centroids-clusters`;
  }

  const sourceObj = map.value.getSource(sourceName) as mapboxgl.GeoJSONSource;
  if (!sourceObj) return;

  // Get all visible cluster features for this layer
  const clusterFeatures = map.value.queryRenderedFeatures(undefined, {
    layers: [clusterLayerName].filter((id) => map.value.getLayer(id)),
  });

  // Find which cluster contains the selected feature
  let foundClusterId: number | string | null = null;
  let foundClusterSource: string | null = null;

  // Check each cluster to see if it contains our selected feature
  for (const clusterFeature of clusterFeatures) {
    const clusterId = clusterFeature.properties?.cluster_id;
    if (clusterId === undefined) continue;

    try {
      // Get the leaves (individual points) of this cluster
      const leaves: Feature[] = await new Promise((resolve, reject) => {
        sourceObj.getClusterLeaves(
          clusterId,
          Infinity, // Get ALL leaves in the cluster (no limit)
          0,
          (err, features) => {
            if (err) {
              reject(err);
            } else {
              resolve(features as Feature[]);
            }
          },
        );
      });

      // Check if any leaf matches our selected feature
      const containsSelected = leaves.some(
        (leaf) => leaf.properties?.alertID === selectedAlertId,
      );

      if (containsSelected) {
        foundClusterId = clusterId;
        foundClusterSource = sourceName;
        break; // Stop searching
      }
    } catch {
      continue;
    }
  }

  // Only update if we found a NEW different cluster
  // Don't reset if we simply didn't find any clusters (they might be hidden at current zoom)
  if (
    foundClusterId !== null &&
    foundClusterId !== undefined &&
    foundClusterSource
  ) {
    // We found a cluster - update if it's different from the previous one
    if (
      foundClusterId !== prevClusterId ||
      foundClusterSource !== prevClusterSource
    ) {
      // Update the selected cluster refs
      selectedClusterId.value = foundClusterId;
      selectedClusterSource.value = foundClusterSource;

      // Update cluster styling using paint properties (clusters don't have stable feature IDs)
      updateClusterHighlight();
    }
  }
  // If no cluster found, keep the previous cluster highlighted so it shows when zooming back out
};

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

  // Prevent cluster features from being displayed in sidebar
  if (
    feature.properties.cluster ||
    feature.properties.cluster_id !== undefined
  ) {
    return;
  }

  const featureObject = feature.properties;

  const featureGeojson = {
    type: feature.type,
    geometry: feature.geometry,
    properties: feature.properties,
  };

  // For centroid layers, use alertID as the feature ID (due to promoteId)
  // For other layers, use feature.id
  const featureId = layerId.includes("-centroids")
    ? featureObject.alertID
    : feature.id;

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

  // Reset the previously selected feature (on both geometry and centroid layers if applicable)
  if (selectedFeatureId.value !== null && selectedFeatureSource.value) {
    map.value.setFeatureState(
      {
        source: selectedFeatureSource.value,
        id: selectedFeatureId.value,
      },
      { selected: false },
    );

    // Also reset on the companion layer (centroid ↔ geometry)
    const companionLayer = getCompanionLayerId(
      selectedFeatureSource.value,
      selectedFeature.value?.alertID,
    );
    if (companionLayer && map.value.getSource(companionLayer)) {
      let companionFeatureId;

      if (companionLayer.includes("-centroids")) {
        // Centroid layers use promoteId: "alertID"
        companionFeatureId = selectedFeature.value?.alertID;
      } else {
        // Geometry layers use feature.id - need to look up the actual feature
        const source = map.value.getSource(
          companionLayer,
        ) as mapboxgl.GeoJSONSource;
        const sourceData = (
          source as mapboxgl.GeoJSONSource & {
            _data?: { features?: Feature[] };
          }
        )._data;
        const companionFeature = sourceData?.features?.find(
          (f) => f.properties?.alertID === selectedFeature.value?.alertID,
        );
        companionFeatureId = companionFeature?.id;
      }

      if (companionFeatureId !== undefined && companionFeatureId !== null) {
        map.value.setFeatureState(
          { source: companionLayer, id: companionFeatureId },
          { selected: false },
        );
      }
    }
  }

  // Set new feature state on the current layer
  map.value.setFeatureState(
    { source: layerId, id: featureId },
    { selected: true },
  );

  // For polygon/linestring features (or their centroid representations),
  // also set state on companion layer so selection persists across zoom thresholds
  const geometryType = feature.geometry.type;
  const isPolygonLinestring =
    geometryType === "Polygon" ||
    geometryType === "LineString" ||
    geometryType === "MultiPolygon" ||
    layerId.includes("-centroids"); // Centroids are Points but represent Polygons/LineStrings

  if (isPolygonLinestring) {
    const companionLayer = getCompanionLayerId(layerId, featureObject.alertID);
    if (companionLayer && map.value.getSource(companionLayer)) {
      let companionFeatureId;

      if (companionLayer.includes("-centroids")) {
        // Centroid layers use promoteId: "alertID"
        companionFeatureId = featureObject.alertID;
      } else {
        // Geometry layers use feature.id - need to look up the actual feature
        const source = map.value.getSource(
          companionLayer,
        ) as mapboxgl.GeoJSONSource;
        const sourceData = (
          source as mapboxgl.GeoJSONSource & {
            _data?: { features?: Feature[] };
          }
        )._data;
        const companionFeature = sourceData?.features?.find(
          (f) => f.properties?.alertID === featureObject.alertID,
        );
        companionFeatureId = companionFeature?.id;
      }

      if (companionFeatureId !== undefined && companionFeatureId !== null) {
        map.value.setFeatureState(
          { source: companionLayer, id: companionFeatureId },
          { selected: true },
        );
      }
    }
  }

  delete featureObject["YYYYMM"];

  // Update component state
  localAlertsData.value = featureGeojson;
  selectedFeature.value = featureObject; // Store properties for sidebar
  selectedFeatureGeometry.value = feature.geometry; // Store geometry for cluster highlighting
  selectedFeatureId.value = featureId;
  selectedFeatureSource.value = layerId;
  showSidebar.value = true;
  showIntroPanel.value = false;

  if (featureObject["alertID"]) {
    isAlert.value = true;

    // Highlight any cluster that contains this feature (after a brief delay - in order to let clusters render after selection).
    setTimeout(() => {
      highlightClusterContainingFeature(layerId);
    }, 100);
  } else {
    isAlert.value = false;

    // If a Mapeo feature is selected, clear any cluster highlights
    if (selectedClusterId.value !== null) {
      selectedClusterId.value = null;
      selectedClusterSource.value = null;
      updateClusterHighlight();
    }
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
};

/**
 * Resets the currently selected feature, clearing its state and UI highlights.
 */
const resetSelectedFeature = () => {
  if (selectedFeatureId.value === null || !selectedFeatureSource.value) {
    return;
  }

  // Reset feature state on the current layer
  map.value.setFeatureState(
    { source: selectedFeatureSource.value, id: selectedFeatureId.value },
    { selected: false },
  );

  // Also reset on the companion layer (centroid ↔ geometry) if applicable
  const companionLayer = getCompanionLayerId(
    selectedFeatureSource.value,
    selectedFeature.value?.alertID,
  );
  if (companionLayer && map.value.getSource(companionLayer)) {
    let companionFeatureId;

    if (companionLayer.includes("-centroids")) {
      // Centroid layers use promoteId: "alertID"
      companionFeatureId = selectedFeature.value?.alertID;
    } else {
      // Geometry layers use feature.id - need to look up the actual feature
      const source = map.value.getSource(
        companionLayer,
      ) as mapboxgl.GeoJSONSource;
      const sourceData = (
        source as mapboxgl.GeoJSONSource & {
          _data?: { features?: Feature[] };
        }
      )._data;
      const companionFeature = sourceData?.features?.find(
        (f) => f.properties?.alertID === selectedFeature.value?.alertID,
      );
      companionFeatureId = companionFeature?.id;
    }

    if (companionFeatureId !== undefined && companionFeatureId !== null) {
      map.value.setFeatureState(
        { source: companionLayer, id: companionFeatureId },
        { selected: false },
      );
    }
  }

  // Reset cluster highlight
  if (selectedClusterId.value !== null && selectedClusterSource.value) {
    selectedClusterId.value = null;
    selectedClusterSource.value = null;
    updateClusterHighlight(); // Update styling using paint properties
  }

  localAlertsData.value = props.alertsData;
  selectedFeature.value = null;
  selectedFeatureGeometry.value = null;
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
 * Repositions the map to its initial view
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
      // Point and centroid layers need to restore their cluster exclusion filter
      if (layer.id.endsWith("-point") || layer.id.endsWith("-centroids")) {
        map.value.setFilter(layer.id, ["!", ["has", "point_count"]]);
      } else {
        map.value.setFilter(layer.id, null);
      }
    }
  });

  // Fly to the initial position
  map.value.flyTo({
    center: [props.mapboxLongitude || 0, props.mapboxLatitude || -15],
    zoom: props.mapboxZoom || 2.5,
    pitch: props.mapboxPitch || 0,
    bearing: props.mapboxBearing || 0,
  });

  // After map movement is complete, reset visibility
  map.value.once("idle", () => {
    // Reset legend visibility state
    mapLegendContent.value = mapLegendContent.value.map(
      (item: MapLegendItem) => ({
        ...item,
        visible: true,
      }),
    );

    // Make all layers visible
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
