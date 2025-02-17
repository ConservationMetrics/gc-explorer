<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from "vue";
import { useI18n } from "vue-i18n";

import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

import bbox from "@turf/bbox";
import { lineString } from "@turf/helpers";
import length from "@turf/length";
import along from "@turf/along";
import rulerControl from "mapbox-gl-ruler-control";

import {
  changeMapStyle,
  prepareMapLegendLayers,
  prepareCoordinatesForSelectedFeature,
  toggleLayerVisibility as utilsToggleLayerVisibility,
} from "@/utils/mapFunctions.ts";

import BasemapSelector from "@/components/shared/BasemapSelector.vue";
import ViewSidebar from "@/components/shared/ViewSidebar.vue";
import MapLegend from "@/components/shared/MapLegend.vue";
const { t } = useI18n();

const props = defineProps({
  alertsData: Object,
  alertsStatistics: Object,
  allowedFileExtensions: Object,
  logoUrl: String,
  mapLegendLayerIds: String,
  mapboxAccessToken: String,
  mapboxBearing: Number,
  mapboxLatitude: Number,
  mapboxLongitude: Number,
  mapboxPitch: Number,
  mapboxProjection: String,
  mapboxStyle: String,
  mapboxZoom: Number,
  mapbox3d: Boolean,
  mapeoData: Object,
  mediaBasePath: String,
  mediaBasePathAlerts: String,
  planetApiKey: String,
});

const calculateHectares = ref(false);
const dateOptions = ref([]);
const hasRulerControl = ref(false);
const map = ref(null);
const showBasemapSelector = ref(false);
const showIntroPanel = ref(true);
const showSidebar = ref(true);
const showSlider = ref(false);

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
  });
});

// Define emits
const emit = defineEmits(["reset-legend-visibility"]);

// Map content
// Add data to the map and set up event listeners
const featuresUnderCursor = ref(0);
const hasLineStrings = ref(false);
const mapeoDataColor = ref(null);
const addAlertsData = () => {
  const geoJsonSource = props.alertsData;

  // Check if the data contains Polygon features for recent alerts
  if (
    geoJsonSource.mostRecentAlerts.features.some(
      (feature) =>
        feature.geometry.type === "Polygon" ||
        feature.geometry.type === "MultiPolygon",
    )
  ) {
    // Add the most recent alerts source to the map as Polygons
    if (!map.value.getSource("most-recent-alerts-polygon")) {
      map.value.addSource("most-recent-alerts-polygon", {
        type: "geojson",
        data: {
          ...geoJsonSource.mostRecentAlerts,
          features: geoJsonSource.mostRecentAlerts.features.filter(
            (feature) =>
              feature.geometry.type === "Polygon" ||
              feature.geometry.type === "MultiPolygon",
          ),
        },
      });
    }

    // Add a layer for most recent alerts Polygons
    if (!map.value.getLayer("most-recent-alerts-polygon")) {
      map.value.addLayer({
        id: "most-recent-alerts-polygon",
        type: "fill",
        source: "most-recent-alerts-polygon",
        paint: {
          "fill-color": [
            "case",
            ["boolean", ["feature-state", "selected"], false],
            "#FFFF00",
            "#FF0000",
          ],
          "fill-opacity": 0.5,
        },
      });
    }

    // Add a stroke for most recent alerts Polygons
    if (!map.value.getLayer("most-recent-alerts-polygon-stroke")) {
      map.value.addLayer({
        id: "most-recent-alerts-polygon-stroke",
        type: "line",
        source: "most-recent-alerts-polygon",
        paint: {
          "line-color": [
            "case",
            ["boolean", ["feature-state", "selected"], false],
            "#FFFF00",
            "#FF0000",
          ],
          "line-width": 2,
        },
      });
    }
  }

  // Check if the data contains LineString features for recent alerts
  if (
    geoJsonSource.mostRecentAlerts.features.some(
      (feature) => feature.geometry.type === "LineString",
    )
  ) {
    // Add the most recent alerts source to the map as LineStrings
    if (!map.value.getSource("most-recent-alerts-linestring")) {
      map.value.addSource("most-recent-alerts-linestring", {
        type: "geojson",
        data: {
          ...geoJsonSource.mostRecentAlerts,
          features: geoJsonSource.mostRecentAlerts.features.filter(
            (feature) => feature.geometry.type === "LineString",
          ),
        },
      });
    }

    // Add a layer for most recent alerts LineStrings
    if (!map.value.getLayer("most-recent-alerts-linestring")) {
      map.value.addLayer({
        id: "most-recent-alerts-linestring",
        type: "line",
        source: "most-recent-alerts-linestring",
        paint: {
          "line-color": [
            "case",
            ["boolean", ["feature-state", "selected"], false],
            "#FFFF00",
            "#FF0000",
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

  // Check if the data contains Polygon features for previous alerts
  if (
    geoJsonSource.previousAlerts.features.some(
      (feature) =>
        feature.geometry.type === "Polygon" ||
        feature.geometry.type === "MultiPolygon",
    )
  ) {
    // Add the previous alerts source to the map as Polygons
    if (!map.value.getSource("previous-alerts-polygon")) {
      map.value.addSource("previous-alerts-polygon", {
        type: "geojson",
        data: {
          ...geoJsonSource.previousAlerts,
          features: geoJsonSource.previousAlerts.features.filter(
            (feature) =>
              feature.geometry.type === "Polygon" ||
              feature.geometry.type === "MultiPolygon",
          ),
        },
      });
    }

    // Add a layer for previous alerts Polygons
    if (!map.value.getLayer("previous-alerts-polygon")) {
      map.value.addLayer({
        id: "previous-alerts-polygon",
        type: "fill",
        source: "previous-alerts-polygon",
        paint: {
          "fill-color": [
            "case",
            ["boolean", ["feature-state", "selected"], false],
            "#FFFF00",
            "#FD8D3C",
          ],
          "fill-opacity": 0.5,
        },
      });
    }

    // Add a stroke for previous alerts Polygons
    if (!map.value.getLayer("previous-alerts-polygon-stroke")) {
      map.value.addLayer({
        id: "previous-alerts-polygon-stroke",
        type: "line",
        source: "previous-alerts-polygon",
        paint: {
          "line-color": [
            "case",
            ["boolean", ["feature-state", "selected"], false],
            "#FFFF00",
            "#FD8D3C",
          ],
          "line-width": 2,
        },
      });
    }
  }

  // Check if the data contains LineString features for previous alerts
  if (
    geoJsonSource.previousAlerts.features.some(
      (feature) => feature.geometry.type === "LineString",
    )
  ) {
    // Add the previous alerts source to the map as LineStrings
    if (!map.value.getSource("previous-alerts-linestring")) {
      map.value.addSource("previous-alerts-linestring", {
        type: "geojson",
        data: {
          ...geoJsonSource.previousAlerts,
          features: geoJsonSource.previousAlerts.features.filter(
            (feature) => feature.geometry.type === "LineString",
          ),
        },
      });
    }

    // Add a layer for previous alerts LineStrings
    if (!map.value.getLayer("previous-alerts-linestring")) {
      map.value.addLayer({
        id: "previous-alerts-linestring",
        type: "line",
        source: "previous-alerts-linestring",
        filter: ["==", "$type", "LineString"],
        paint: {
          "line-color": [
            "case",
            ["boolean", ["feature-state", "selected"], false],
            "#FFFF00",
            "#FD8D3C",
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

  // Add event listeners for layers that start with 'most-recent-alerts' and 'alerts'
  map.value.getStyle().layers.forEach((layer) => {
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
        (e) => {
          selectFeature(e.features[0], layer.id);
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
};
const addMapeoData = () => {
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
      (e) => {
        selectFeature(e.features[0], layerId);
      },
      { passive: true },
    );
  });
};
const prepareMapCanvasContent = () => {
  if (props.alertsData) {
    addAlertsData();
  }
  if (props.mapeoData) {
    addMapeoData();
  }
  addPulsingCircles();
  prepareMapLegendContent();

  // Add buffer for LineStrings to make them easier to select
  if (hasLineStrings.value) {
    map.value.on("mousemove", handleBufferMouseEvent);
    map.value.on("click", handleBufferClick);
  }
};

// Handlers for buffer around LineStrings
const isOnlyLineStringData = () => {
  const allFeatures = [
    ...props.alertsData.mostRecentAlerts.features,
    ...props.alertsData.previousAlerts.features,
  ];
  return allFeatures.every((feature) => feature.geometry.type === "LineString");
};
const handleBufferClick = (e) => {
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
const handleBufferMouseEvent = (e) => {
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

// Add pulsing circles around the most recent alerts
const pulsingCirclesAdded = ref(null);
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

  const addPulsingMarker = (feature) => {
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
      const line = lineString(feature.geometry.coordinates);
      const lineLength = length(line, { units: "kilometers" });
      const midpoint = along(line, lineLength / 2, { units: "kilometers" });
      lng = midpoint.geometry.coordinates[0];
      lat = midpoint.geometry.coordinates[1];
    } else if (feature.geometry.type === "Point") {
      [lng, lat] = feature.geometry.coordinates;
    } else {
      return;
    }

    // Determine the opacity  based on confidenceLevel
    let confidenceInterval = "1";
    if (feature.properties.confidenceLevel === "0") {
      confidenceInterval = "0";
    }

    // Create a new marker and add it to the map
    const pulsingMarker = pulsingDot.cloneNode();
    pulsingMarker.classList.add(`pulsing-dot-${confidenceInterval}`);
    new mapboxgl.Marker(pulsingMarker)
      .setLngLat([parseFloat(lng), parseFloat(lat)])
      .addTo(map.value);
  };

  // Add pulsing markers for most recent alerts
  props.alertsData.mostRecentAlerts.features.forEach(addPulsingMarker);
};
// Method to remove pulsing circles
const removePulsingCircles = () => {
  document.querySelectorAll(".pulsing-dot").forEach((el) => el.remove());
  pulsingCirclesAdded.value = false;
};

// Basemap selector methods
const currentBasemap = ref(props.mapboxStyle);
const handleBasemapChange = (newBasemap) => {
  removePulsingCircles();
  changeMapStyle(map.value, newBasemap, props.planetApiKey);

  currentBasemap.value = newBasemap;

  // Once map is idle, re-add sources, layers, and event listeners
  map.value.once("idle", () => {
    prepareMapCanvasContent();
  });
};

// Map legend methods
const mapLegendContent = ref(null);
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
const toggleLayerVisibility = (item) => {
  utilsToggleLayerVisibility(map.value, item);
};

// Sidebar content
// Methods for date range selection and filtering
const selectedDateRange = ref(null);
const convertDates = (start, end) => {
  // Convert "MM-YYYY" to "YYYYMM" for comparison
  const convertToDate = (dateStr) => {
    const [month, year] = dateStr.split("-").map(Number);
    return (year * 100 + month).toString();
    // Converts to YYYYMM format
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
const getDateOptions = () => {
  let dates = props.alertsStatistics.allDates;

  // Check if there are more than 12 dates
  // Replace any earlier dates with "Earlier"
  if (dates.length > 12) {
    const last12Dates = dates.slice(-12);

    dates = [t("earlier"), ...last12Dates];
  }

  return dates;
};
const handleDateRangeChanged = (newRange) => {
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
    map.value.getStyle().layers.forEach((layer) => {
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
      .layers.filter((layer) => layer.id.startsWith("most-recent-alerts"));
    const recentAlertsFeatures = [];
    recentAlertsLayers.forEach((layer) => {
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
  });
};
const handleSidebarClose = () => {
  showSidebar.value = false;
  resetSelectedFeature();
};
const filteredData = computed(() => {
  // Function to filter features by date range.
  // This is being passed to the Download component in
  // AlertsIntroPanel.

  // If no date range is selected, return the full data
  if (!selectedDateRange.value) {
    return props.alertsData;
  }

  const [start, end] = selectedDateRange.value;

  const [startDate, endDate] = convertDates(start, end);

  const filterFeatures = (features) => {
    return features.filter((feature) => {
      const monthDetected = feature.properties["YYYYMM"];
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

// Methods for selecting and resetting
const downloadAlert = ref(false);
const imageCaption = ref(null);
const imageUrl = ref([]);
const isAlert = ref(false);
const selectedFeature = ref(null);
const selectedFeatureGeojson = ref(null);
const selectedFeatureId = ref(null);
const selectedFeatureSource = ref(null);
const selectFeature = (feature, layerId) => {
  const featureObject = feature.properties;

  const featureGeojson = {
    type: feature.type,
    geometry: feature.geometry,
    properties: feature.properties,
  };
  const featureId = feature.id;

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
  selectedFeature.value = featureObject;
  selectedFeatureGeojson.value = featureGeojson;
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
    photos.forEach((photo) => imageUrl.value.push(photo.trim()));
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
const resetSelectedFeature = () => {
  if (selectedFeatureId.value === null || !selectedFeatureSource.value) {
    return;
  }
  map.value.setFeatureState(
    { source: selectedFeatureSource.value, id: selectedFeatureId.value },
    { selected: false },
  );
  selectedFeature.value = null;
  selectedFeatureGeojson.value = null;
  selectedFeatureId.value = null;
  selectedFeatureSource.value = null;
};
const resetToInitialState = () => {
  resetSelectedFeature();
  showSidebar.value = true;
  showIntroPanel.value = true;
  downloadAlert.value = false;
  imageUrl.value = [];
  imageCaption.value = null;
  selectedDateRange.value = null;

  // Reset the filters for layers that start with 'most-recent-alerts' and 'alerts'
  map.value.getStyle().layers.forEach((layer) => {
    if (
      layer.id.startsWith("most-recent-alerts") ||
      layer.id.startsWith("alerts")
    ) {
      map.value.setFilter(layer.id, null);
    }
  });

  mapLegendContent.value = mapLegendContent.value.map((item) => ({
    ...item,
    visible: true,
  }));
  mapLegendContent.value.forEach((item) => {
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
      :feature-geojson="selectedFeatureGeojson"
      :feature="selectedFeature"
      :file-paths="imageUrl"
      :geojson-selection="filteredData"
      :is-alert="isAlert"
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
