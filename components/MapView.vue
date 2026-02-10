<script setup lang="ts">
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

import { getFilePathsWithExtension } from "@/utils";
import {
  changeMapStyle,
  applyTerrain,
  prepareMapLegendLayers,
  prepareCoordinatesForSelectedFeature,
  toggleLayerVisibility as utilsToggleLayerVisibility,
} from "@/utils/mapFunctions";
import { transformSurveyData } from "@/utils/dataProcessing/transformData";
import { useRecordFetch } from "@/composables/useRecordFetch";

import DataFilter from "@/components/shared/DataFilter.vue";
import ViewSidebar from "@/components/shared/ViewSidebar.vue";
import MapLegend from "@/components/shared/MapLegend.vue";
import BasemapSelector from "@/components/shared/BasemapSelector.vue";

import type { Layer, MapMouseEvent } from "mapbox-gl";
import type {
  AllowedFileExtensions,
  Basemap,
  BasemapConfig,
  DataEntry,
  Dataset,
  FilterValues,
  MapLegendItem,
  MapStatistics,
} from "@/types/types";
import type { FeatureCollection } from "geojson";

const { getRecord } = useRecordFetch();

const props = defineProps<{
  table?: string;
  allowedFileExtensions: AllowedFileExtensions;
  colorColumn?: string;
  filterColumn: string;
  iconColumn?: string;
  mapStatistics: MapStatistics;
  mapLegendLayerIds?: string;
  mapboxAccessToken: string;
  mapboxBearing: number | null;
  mapboxLatitude: number;
  mapboxLongitude: number;
  mapboxPitch: number | null;
  mapboxProjection: string;
  mapboxStyle: string;
  mapboxBasemaps?: BasemapConfig[];
  mapboxZoom: number;
  mapbox3d: boolean;
  mapbox3dTerrainExaggeration: number;
  mapData: Dataset | FeatureCollection;
  mediaBasePath?: string;
  mediaBasePathIcons?: string;
  mediaColumn?: string;
  planetApiKey?: string;
}>();

/**
 * Normalizes mapData to a Dataset (array of DataEntry) for internal use.
 * If the API returns a GeoJSON FeatureCollection (minimal map endpoint), convert
 * each feature to the shape expected by addDataToMap and DataFilter (geotype,
 * geocoordinates, _id, and properties). Otherwise pass through the array as-is.
 */
const mapDataAsArray = computed((): DataEntry[] => {
  const data = props.mapData;
  if (
    data &&
    typeof data === "object" &&
    "type" in data &&
    data.type === "FeatureCollection" &&
    Array.isArray(data.features)
  ) {
    return data.features.map((f) => {
      const props_ = (f.properties ?? {}) as Record<string, string>;
      const geom = f.geometry;
      const coords =
        geom && "coordinates" in geom ? JSON.stringify(geom.coordinates) : "[]";
      const type = geom && "type" in geom ? geom.type : "Point";
      return {
        ...props_,
        geotype: type,
        geocoordinates: coords,
        _id: f.id != null ? String(f.id) : props_._id,
      } as DataEntry;
    });
  }
  return Array.isArray(data) ? [...(data as Dataset)] : [];
});

const filteredData = ref<DataEntry[]>([]);
const processedData = ref<DataEntry[]>([]);

watch(
  mapDataAsArray,
  (arr) => {
    processedData.value = [...arr];
    filteredData.value = [...arr];
  },
  { immediate: true },
);
const map = ref();
const selectedFeature = ref();
const selectedFeatureOriginal = ref();
const showSidebar = ref(true);
const showBasemapSelector = ref(false);
const showIntroPanel = ref(true);
const showIcons = ref(false);
const loadingIcons = ref(false);
const loadingFeature = ref(false);
const featureLoadError = ref<string | null>(null);

// Check if icon toggle is available
const canToggleIcons = computed(() => {
  return !!(props.iconColumn && props.mediaBasePathIcons);
});

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

  // Apply 3D terrain whenever the style loads

  let controlsAdded = false;

  // Apply terrain whenever style loads (initial load and style changes)
  map.value.on("style.load", () => {
    applyTerrain(map.value, props.mapbox3d, props.mapbox3dTerrainExaggeration);
  });

  map.value.on("load", () => {
    // Add 3D Terrain if set (for initial load)
    applyTerrain(map.value, props.mapbox3d, props.mapbox3dTerrainExaggeration);

    // Only add controls once (on first load, not on style changes)
    if (!controlsAdded) {
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

      showBasemapSelector.value = true;
      controlsAdded = true;
    } else {
      // On style changes (not initial load), just prepare canvas content
      prepareMapCanvasContent();
    }
  });
});

/**
 * Adds data to the map by creating and managing GeoJSON sources and layers.
 * It removes existing data layers and sources, creates a new GeoJSON source
 * from the filtered data, and adds appropriate layers for different feature types.
 * Event listeners are also added for user interactions with the map features.
 */
const addDataToMap = () => {
  // Remove existing data layers from the map
  if (map.value) {
    map.value.getStyle().layers.forEach((layer: Layer) => {
      if (layer.id.startsWith("data-layer")) {
        if (map.value.getLayer(layer.id)) {
          map.value.removeLayer(layer.id);
        }
      }
    });
    if (map.value.getSource("data-source")) {
      map.value.removeSource("data-source");
    }
  }

  // Create a GeoJSON source with all the features
  const geoJsonSource = {
    type: "FeatureCollection",
    features: filteredData.value.map((feature) => ({
      type: "Feature",
      geometry: {
        type: feature.geotype,
        coordinates: JSON.parse(feature.geocoordinates),
      },
      properties: {
        feature,
      },
    })),
  };

  // Add the source to the map
  if (!map.value.getSource("data-source")) {
    map.value.addSource("data-source", {
      type: "geojson",
      data: geoJsonSource,
    });
  }

  // Check for feature types in the GeoJSON data
  const hasPointFeatures = geoJsonSource.features.some(
    (feature) => feature.geometry.type === "Point",
  );
  const hasLineStringFeatures = geoJsonSource.features.some(
    (feature) => feature.geometry.type === "LineString",
  );
  const hasPolygonFeatures = geoJsonSource.features.some(
    (feature) => feature.geometry.type === "Polygon",
  );

  // Add a layer for Point features if present
  if (hasPointFeatures && !map.value.getLayer("data-layer-point")) {
    // Determine if we should use icons based on config and toggle state
    const useIcons =
      showIcons.value && props.iconColumn && props.mediaBasePathIcons;

    if (useIcons) {
      // Add symbol layer for icons
      map.value.addLayer({
        id: "data-layer-point",
        type: "symbol",
        source: "data-source",
        filter: ["==", "$type", "Point"],
        layout: {
          "icon-image": [
            "concat",
            "icon-",
            ["get", props.iconColumn, ["get", "feature"]],
          ],
          "icon-size": 1.0,
          "icon-allow-overlap": true,
        },
      });
    } else {
      // Use colorColumn if specified, otherwise fall back to filter-color
      const colorExpression = props.colorColumn
        ? [
            "coalesce",
            ["get", props.colorColumn, ["get", "feature"]],
            ["get", "filter-color", ["get", "feature"]],
          ]
        : ["get", "filter-color", ["get", "feature"]];

      map.value.addLayer({
        id: "data-layer-point",
        type: "circle",
        source: "data-source",
        filter: ["==", "$type", "Point"],
        paint: {
          "circle-radius": 8,
          "circle-color": colorExpression,
          "circle-stroke-width": 3,
          "circle-stroke-color": "#fff",
        },
      });
    }
  }

  // Add a layer for LineString features if present
  if (hasLineStringFeatures && !map.value.getLayer("data-layer-linestring")) {
    // Use colorColumn if specified, otherwise fall back to filter-color
    const colorExpression = props.colorColumn
      ? [
          "coalesce",
          ["get", props.colorColumn, ["get", "feature"]],
          ["get", "filter-color", ["get", "feature"]],
        ]
      : ["get", "filter-color", ["get", "feature"]];

    map.value.addLayer({
      id: "data-layer-linestring",
      type: "line",
      source: "data-source",
      filter: ["==", "$type", "LineString"],
      paint: {
        "line-color": colorExpression,
        "line-width": 2,
      },
    });
  }

  // Add a layer for Polygon features if present
  if (hasPolygonFeatures && !map.value.getLayer("data-layer-polygon")) {
    // Use colorColumn if specified, otherwise fall back to filter-color
    const colorExpression = props.colorColumn
      ? [
          "coalesce",
          ["get", props.colorColumn, ["get", "feature"]],
          ["get", "filter-color", ["get", "feature"]],
        ]
      : ["get", "filter-color", ["get", "feature"]];

    map.value.addLayer({
      id: "data-layer-polygon",
      type: "fill",
      source: "data-source",
      filter: ["==", "$type", "Polygon"],
      paint: {
        "fill-color": colorExpression,
        "fill-opacity": 0.5,
      },
    });
  }

  // Add event listeners
  const layersToAddListeners = [];
  if (hasPointFeatures) layersToAddListeners.push("data-layer-point");
  if (hasLineStringFeatures) layersToAddListeners.push("data-layer-linestring");
  if (hasPolygonFeatures) layersToAddListeners.push("data-layer-polygon");

  layersToAddListeners.forEach((layerId) => {
    map.value.on(
      "mouseenter",
      layerId,
      () => {
        map.value.getCanvas().style.cursor = "pointer";
      },
      { passive: true },
    );
    map.value.on(
      "mouseleave",
      layerId,
      () => {
        map.value.getCanvas().style.cursor = "";
      },
      { passive: true },
    );
    map.value.on(
      "click",
      layerId,
      async (e: MapMouseEvent) => {
        if (e.features && e.features.length > 0 && e.features[0].properties) {
          let featureObject = e.features[0].properties.feature;
          if (typeof featureObject === "string") {
            featureObject = JSON.parse(featureObject);
          }
          const recordId = featureObject?._id ?? featureObject?.id;
          if (props.table && recordId != null) {
            loadingFeature.value = true;
            featureLoadError.value = null;
            showSidebar.value = true;
            showIntroPanel.value = false;
            try {
              const raw = await getRecord(props.table, String(recordId));
              if (raw == null) {
                featureLoadError.value = "Record not found";
                selectedFeature.value = null;
                selectedFeatureOriginal.value = null;
                return;
              }
              // Transform once when fetched (cached for this selection) for display;
              // download uses raw via selectedFeatureOriginal below.
              const forDisplay = transformSurveyData(
                [raw as DataEntry],
                props.iconColumn,
              )[0];
              selectedFeature.value = forDisplay;
              const gType = raw?.g__type as string | undefined;
              const gCoords = raw?.g__coordinates;
              const coords =
                typeof gCoords === "string"
                  ? JSON.parse(gCoords as string)
                  : gCoords;
              selectedFeatureOriginal.value = {
                type: "Feature",
                geometry: {
                  type: (gType ?? "Point") as
                    | "Point"
                    | "LineString"
                    | "Polygon",
                  coordinates: coords ?? [],
                },
                properties: { ...raw },
              };
            } catch (err) {
              featureLoadError.value =
                err && typeof err === "object" && "statusMessage" in err
                  ? String((err as { statusMessage: string }).statusMessage)
                  : "Failed to load record";
              selectedFeature.value = null;
              selectedFeatureOriginal.value = null;
            } finally {
              loadingFeature.value = false;
            }
          } else {
            const featureGeojson = {
              type: e.features[0].type,
              geometry: e.features[0].geometry,
              properties: { ...featureObject },
            };
            delete featureGeojson.properties["filter-color"];
            const displayFeature = JSON.parse(JSON.stringify(featureObject));
            delete displayFeature["filter-color"];
            if (displayFeature.geocoordinates) {
              displayFeature.geocoordinates =
                prepareCoordinatesForSelectedFeature(
                  displayFeature.geocoordinates,
                );
            }
            selectedFeature.value = displayFeature;
            selectedFeatureOriginal.value = featureGeojson;
            showSidebar.value = true;
            showIntroPanel.value = false;
          }
        }
      },
      { passive: true },
    );
  });
};

/** Load icon images when using icon mode */
const loadIconImages = async () => {
  if (!props.iconColumn || !props.mediaBasePathIcons || !map.value) return;

  // Get unique icon filenames from data
  const iconFilenames = new Set<string>();
  filteredData.value.forEach((item) => {
    const iconFilename = item[props.iconColumn!];
    if (iconFilename && typeof iconFilename === "string") {
      iconFilenames.add(iconFilename);
    }
  });

  // Load each unique icon
  for (const filename of iconFilenames) {
    const iconId = `icon-${filename}`;
    if (!map.value.hasImage(iconId)) {
      try {
        const originalUrl = `${props.mediaBasePathIcons}/${filename}`;
        // Proxy through our server to avoid CORS issues with Mapbox Canvas API
        const iconUrl = `/api/proxy-icon?url=${encodeURIComponent(originalUrl)}`;
        const image = await new Promise<HTMLImageElement>((resolve, reject) => {
          const img = new Image();
          img.crossOrigin = "anonymous";
          img.onload = () => resolve(img);
          img.onerror = reject;
          img.src = iconUrl;
        });
        // Check again before adding (in case of race condition from multiple toggles)
        if (!map.value.hasImage(iconId)) {
          map.value.addImage(iconId, image);
        }
      } catch (error) {
        console.error(`Failed to load icon: ${filename}`, error);
      }
    }
  }
};

/** Prepare map canvas content by adding data and legend */
const prepareMapCanvasContent = async () => {
  // For initial load, load icons if needed
  if (showIcons.value && props.iconColumn && props.mediaBasePathIcons) {
    await loadIconImages();
  }
  addDataToMap();
  prepareMapLegendContent();
};

/** Filter data based on selected values from DataFilter component */
const filterValues = (values: FilterValues) => {
  if (values.includes("null")) {
    filteredData.value = [...processedData.value];
  } else {
    filteredData.value = processedData.value.filter((item) =>
      values.includes(item[props.filterColumn]),
    );
  }
  addDataToMap(); // Update the map data
};

const currentBasemap = ref<Basemap>({ id: "custom", style: props.mapboxStyle });

/** Handle basemap change and update map style */
const handleBasemapChange = (newBasemap: Basemap) => {
  changeMapStyle(map.value, newBasemap, props.planetApiKey);

  currentBasemap.value = newBasemap;

  // Once map style loads, terrain will be re-applied via style.load event
  // Then when map is idle, re-add sources, layers, and event listeners
  map.value.once("idle", () => {
    prepareMapCanvasContent();
  });
};

const mapLegendContent = ref();

/** Prepare map legend content based on layer IDs */
const prepareMapLegendContent = () => {
  if (!props.mapLegendLayerIds) {
    return;
  }
  map.value.once("idle", () => {
    mapLegendContent.value = prepareMapLegendLayers(
      map.value,
      props.mapLegendLayerIds ?? null,
    );
  });
};

/** Toggle visibility of a map layer */
const toggleLayerVisibility = (item: MapLegendItem) => {
  utilsToggleLayerVisibility(map.value, item);
};

/** Reset the map to initial state */
const resetToInitialState = () => {
  selectedFeature.value = null;
  selectedFeatureOriginal.value = null;
  featureLoadError.value = null;
  showSidebar.value = true;
  showIntroPanel.value = true;

  // Fly to the initial position
  map.value.flyTo({
    center: [props.mapboxLongitude || 0, props.mapboxLatitude || -15],
    zoom: props.mapboxZoom || 2.5,
    pitch: props.mapboxPitch || 0,
    bearing: props.mapboxBearing || 0,
  });
};

/** Handle sidebar close */
const handleSidebarClose = () => {
  showSidebar.value = false;
  selectedFeature.value = null;
  selectedFeatureOriginal.value = null;
  featureLoadError.value = null;
  showIntroPanel.value = true;
};

/** Toggle between icons and points */
const handleToggleIcons = async () => {
  if (!map.value) return;

  const newShowIcons = !showIcons.value;

  // Remove existing point layer first
  if (map.value.getLayer("data-layer-point")) {
    map.value.removeLayer("data-layer-point");
  }

  // If switching TO icons, load them FIRST before updating state
  if (newShowIcons && props.iconColumn && props.mediaBasePathIcons) {
    loadingIcons.value = true;
    try {
      await loadIconImages();
    } finally {
      loadingIcons.value = false;
    }
  }

  // NOW update the state
  showIcons.value = newShowIcons;

  // Add the new layer (icons are guaranteed to be loaded if needed)
  addDataToMap();
  prepareMapLegendContent();
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
      {{ $t("resetMap") }}
    </button>
    <DataFilter
      v-if="filterColumn"
      :data="processedData"
      :filter-column="filterColumn"
      :color-column="colorColumn"
      :show-colored-dot="true"
      @filter="filterValues"
    />
    <ViewSidebar
      :allowed-file-extensions="allowedFileExtensions"
      :feature="selectedFeature"
      :feature-geojson="selectedFeatureOriginal"
      :file-paths="
        getFilePathsWithExtension(
          selectedFeature,
          allowedFileExtensions,
          mediaColumn,
        )
      "
      :is-alerts-dashboard="false"
      :map-data="processedData"
      :map-statistics="mapStatistics"
      :media-base-path="mediaBasePath"
      :show-intro-panel="showIntroPanel"
      :show-sidebar="showSidebar"
      :show-icons="showIcons"
      :can-toggle-icons="canToggleIcons"
      :loading-icons="loadingIcons"
      :loading-feature="loadingFeature"
      :feature-load-error="featureLoadError"
      @close="handleSidebarClose"
      @toggle-icons="handleToggleIcons"
    />
    <MapLegend
      v-if="mapLegendContent && mapData"
      :map-legend-content="mapLegendContent"
      @toggle-layer-visibility="toggleLayerVisibility"
    />
    <BasemapSelector
      v-if="showBasemapSelector"
      :mapbox-style="mapboxStyle"
      :mapbox-basemaps="mapboxBasemaps || []"
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
