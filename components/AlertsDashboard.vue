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
import type { Feature } from "geojson";

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

  map.value.on("load", () => {
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

    prepareMapCanvasContent();

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

    // Check for alertId in URL and select the corresponding alert
    const alertId = route.query.alertId as string;
    if (alertId) {
      const allFeatures = [
        ...props.alertsData.mostRecentAlerts.features,
        ...props.alertsData.previousAlerts.features,
      ];
      const feature = allFeatures.find(
        (f) => f.properties?.alertID === alertId,
      );
      if (feature) {
        // Find the appropriate layer ID for this feature
        const layerId = feature.properties?.isRecent
          ? `most-recent-alerts-${feature.geometry.type.toLowerCase()}`
          : `previous-alerts-${feature.geometry.type.toLowerCase()}`;

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
      }
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
      map.value.addSource(layerId, {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: features.filter(
            (feature) => feature.geometry.type === type,
          ),
        },
        minzoom: 10,
      });
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
        if (!map.value.getLayer(layerId)) {
          map.value.addLayer({
            id: layerId,
            type: "circle",
            source: layerId,
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
   */
  const loadMapImage = (iconName: string, iconUrl: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      map.value.loadImage(iconUrl, (error: Error, image: HTMLImageElement) => {
        if (error) {
          reject(error);
          return;
        }

        if (!map.value.hasImage(iconName)) {
          map.value.addImage(iconName, image);
        }
        resolve();
      });
    });
  };

  /**
   * Adds a GeoJSON point layer to the map using the geographicCentroid property,
   * with specified icon.
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
      });
    }

    if (!map.value.getLayer(layerId)) {
      map.value.addLayer({
        id: layerId,
        type: "symbol",
        source: layerId,
        layout: {
          "icon-image": iconName,
          "icon-size": 0.75,
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
      id: feature.Id,
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
      generateId: true,
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
  if (props.alertsData) {
    await addAlertsData();
  }
  if (props.mapeoData) {
    addMapeoData();
  }
  addPulsingCircles();
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

const pulsingCirclesAdded = ref();
/**
 * Adds pulsing circles around the most recent alerts on the map.
 * The pulsing effect is based on the confidence level of the alerts.
 */
const addPulsingCircles = () => {
  if (pulsingCirclesAdded.value) {
    return;
  }
  pulsingCirclesAdded.value = true;

  if (document.querySelector(".pulsing-dot")) {
    return;
  }
  removePulsingCircles();

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
    new mapboxgl.Marker(pulsingMarker).setLngLat([lng, lat]).addTo(map.value);
  };

  // Add pulsing markers for most recent alerts
  props.alertsData.mostRecentAlerts.features.forEach(addPulsingMarker);
};

/** Removes pulsing circles from the map */
const removePulsingCircles = () => {
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
    let mapLegendLayerIds = props.mapLegendLayerIds;

    // Add most-recent-alerts & previous-alerts layers to mapLegendContent
    if (hasLineStrings.value) {
      mapLegendLayerIds =
        "most-recent-alerts-linestring," +
        (props.alertsData.previousAlerts.features.length
          ? "previous-alerts-linestring,"
          : "") +
        mapLegendLayerIds;
    } else if (hasPoints.value) {
      mapLegendLayerIds =
        "most-recent-alerts-point," +
        (props.alertsData.previousAlerts.features.length
          ? "previous-alerts-point,"
          : "") +
        mapLegendLayerIds;
    } else {
      mapLegendLayerIds =
        "most-recent-alerts-polygon," +
        (props.alertsData.previousAlerts.features.length
          ? "previous-alerts-polygon,"
          : "") +
        mapLegendLayerIds;
    }

    // Add mapeo-data layer to mapLegendContent
    if (props.mapeoData) {
      mapLegendLayerIds = "mapeo-data," + mapLegendLayerIds;
    }

    // if there are no layers to show in the legend, return
    if (!mapLegendLayerIds) {
      return;
    }

    mapLegendContent.value = prepareMapLegendLayers(
      map.value,
      mapLegendLayerIds,
      mapeoDataColor.value,
    );
  });
};

/** Toggles the visibility of a map layer */
const toggleLayerVisibility = (item: MapLegendItem) => {
  utilsToggleLayerVisibility(map.value, item);
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
        layer.id.startsWith("most-recent-alerts") ||
        layer.id.startsWith("previous-alerts")
      ) {
        map.value.setFilter(layer.id, [
          "all",
          [">=", ["get", "YYYYMM"], startDate],
          ["<=", ["get", "YYYYMM"], endDate],
        ]);
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
      addPulsingCircles();
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

const downloadAlert = ref(false);
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

  // Update URL with alertId if it exists
  if (featureObject.alertID) {
    router.replace({
      query: { ...route.query, alertId: featureObject.alertID },
    });
  }

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
  downloadAlert.value = true;

  if (featureObject["alertID"]) {
    isAlert.value = true;
  } else {
    isAlert.value = false;
  }

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

  // Remove alertId from URL when resetting
  const query = { ...route.query };
  delete query.alertId;
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
  downloadAlert.value = false;
  imageUrl.value = [];
  imageCaption.value = null;
  selectedDateRange.value = null;

  // Reset the filters for layers that start with 'most-recent-alerts' and 'alerts'
  map.value.getStyle().layers.forEach((layer: Layer) => {
    if (
      layer.id.startsWith("most-recent-alerts") ||
      layer.id.startsWith("alerts")
    ) {
      map.value.setFilter(layer.id, null);
    }
  });

  mapLegendContent.value = mapLegendContent.value.map(
    (item: MapLegendItem) => ({
      ...item,
      visible: true,
    }),
  );
  mapLegendContent.value.forEach((item: MapLegendItem) => {
    map.value.setLayoutProperty(item.id, "visibility", "visible");
  });
  emit("reset-legend-visibility");

  // Fly to the initial position
  map.value.flyTo({
    center: [props.mapboxLongitude || 0, props.mapboxLatitude || -15],
    zoom: props.mapboxZoom || 2.5,
    pitch: props.mapboxPitch || 0,
    bearing: props.mapboxBearing || 0,
  });

  // Add pulsing circles after the map has finished flying
  // to the initial position. This is for reasons of user experience,
  // as well as the fact that queryRenderedFeatures() will only return
  // features that are visible in the browser viewport.)
  map.value.once("idle", () => {
    addPulsingCircles();
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
      :download-alert="downloadAlert"
      :feature="selectedFeature"
      :file-paths="imageUrl"
      :geojson-selection="filteredData"
      :is-alert="isAlert"
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
