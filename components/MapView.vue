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

import DataFilter from "@/components/shared/DataFilter.vue";
import ViewSidebar from "@/components/shared/ViewSidebar.vue";
import MapLegend from "@/components/shared/MapLegend.vue";
import BasemapSelector from "@/components/shared/BasemapSelector.vue";

import type { Layer, MapMouseEvent } from "mapbox-gl";
import type { FeatureCollection, Feature } from "geojson";
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

const props = defineProps<{
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
  mapData: FeatureCollection;
  mediaBasePath?: string;
  mediaBasePathIcons?: string;
  mediaColumn?: string;
  planetApiKey?: string;
}>();

const map = ref();
const selectedFeature = ref<DataEntry>();
const selectedFeatureOriginal = ref<Feature>();
const showSidebar = ref(true);
const showBasemapSelector = ref(false);
const showIntroPanel = ref(true);
const showIcons = ref(false);
const loadingIcons = ref(false);

// Check if icon toggle is available
const canToggleIcons = computed(() => {
  return !!(props.iconColumn && props.mediaBasePathIcons);
});

const filteredFeatureCollection = ref<FeatureCollection>({
  ...props.mapData,
});

/**
 * Flat Dataset derived from FeatureCollection for components that need it
 * (DataFilter, MapIntroPanel). Contains only the minimal properties present
 * in the FeatureCollection features, not full records.
 */
const flatDataForFilter = computed<Dataset>(() => {
  return filteredFeatureCollection.value.features.map((feature) => ({
    ...feature.properties,
  })) as Dataset;
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

  let controlsAdded = false;

  // Apply 3D terrain whenever the style loads
  map.value.on("style.load", () => {
    applyTerrain(map.value, props.mapbox3d, props.mapbox3dTerrainExaggeration);
  });

  // Apply terrain whenever style loads (initial load and style changes)
  map.value.on("load", () => {
    applyTerrain(map.value, props.mapbox3d, props.mapbox3dTerrainExaggeration);

    // Add 3D Terrain if set (for initial load)
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
 * Adds the FeatureCollection directly to the map as a GeoJSON source and
 * creates layers for each geometry type. No reconstruction from flat arrays.
 */
const addDataToMap = () => {
  if (map.value) {
    // Remove existing data layers from the map
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
  if (!map.value.getSource("data-source")) {
    map.value.addSource("data-source", {
      type: "geojson",
      data: filteredFeatureCollection.value,
    });
  }

  // Check for feature types in the GeoJSON data
  const features = filteredFeatureCollection.value.features;
  const hasPointFeatures = features.some(
    (feature) => feature.geometry.type === "Point",
  );
  const hasLineStringFeatures = features.some(
    (feature) => feature.geometry.type === "LineString",
  );
  const hasPolygonFeatures = features.some(
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
          "icon-image": ["concat", "icon-", ["get", props.iconColumn]],
          "icon-size": [
            "case",
            ["==", ["slice", ["get", props.iconColumn], -4], ".png"],
            1.0,
            ["==", ["slice", ["get", props.iconColumn], -4], ".svg"],
            0.2,
            1.0,
          ],
          "icon-allow-overlap": true,
        },
      });
    } else {
      // Use colorColumn if specified, otherwise fall back to filter-color
      const colorExpression = props.colorColumn
        ? [
            "coalesce",
            ["get", props.colorColumn],
            ["get", "filter-color"],
            "#3333FF",
          ]
        : ["coalesce", ["get", "filter-color"], "#3333FF"];

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
          ["get", props.colorColumn],
          ["get", "filter-color"],
          "#3333FF",
        ]
      : ["coalesce", ["get", "filter-color"], "#3333FF"];

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
          ["get", props.colorColumn],
          ["get", "filter-color"],
          "#3333FF",
        ]
      : ["coalesce", ["get", "filter-color"], "#3333FF"];

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
      (e: MapMouseEvent) => {
        if (!e.features || e.features.length === 0) return;
        const clickedFeature = e.features[0];
        if (!clickedFeature.properties) return;

        // Remove filter-color from properties
        const featureProperties = { ...clickedFeature.properties };
        delete featureProperties["filter-color"];

        // Create display feature with formatted coordinates
        if (featureProperties.geocoordinates) {
          // Rewrite coordinates string from [long, lat] to lat, long, removing brackets for display
          featureProperties.geocoordinates =
            prepareCoordinatesForSelectedFeature(
              featureProperties.geocoordinates,
            );
        } else if (
          clickedFeature.geometry.type === "Point" &&
          clickedFeature.geometry.coordinates
        ) {
          const [lng, lat] = clickedFeature.geometry.coordinates;
          featureProperties.geocoordinates = `${lat}, ${lng}`;
        }

        // Create GeoJSON Feature for download
        const featureGeojson: Feature = {
          type: "Feature",
          geometry: clickedFeature.geometry,
          properties: { ...clickedFeature.properties },
        };
        delete featureGeojson.properties!["filter-color"];

        selectedFeature.value = featureProperties;
        selectedFeatureOriginal.value = featureGeojson;
        showSidebar.value = true;
        showIntroPanel.value = false;
      },
      { passive: true },
    );
  });
};

const loadIconImages = async () => {
  if (!props.iconColumn || !props.mediaBasePathIcons || !map.value) return;

  // Get unique icon filenames from data
  const iconFilenames = new Set<string>();
  filteredFeatureCollection.value.features.forEach((feature) => {
    const iconFilename = feature.properties?.[props.iconColumn!];
    if (iconFilename && typeof iconFilename === "string") {
      iconFilenames.add(iconFilename);
    }
  });

  // Load each unique icon
  for (const filename of iconFilenames) {
    const iconId = `icon-${filename}`;
    if (!map.value.hasImage(iconId)) {
      try {
        // Proxy through our server to avoid CORS issues with Mapbox Canvas API
        const originalUrl = `${props.mediaBasePathIcons}/${filename}`;
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

const prepareMapCanvasContent = async () => {
  // For initial load, load icons if needed
  if (showIcons.value && props.iconColumn && props.mediaBasePathIcons) {
    await loadIconImages();
  }
  addDataToMap();
  prepareMapLegendContent();
};

const filterValues = (values: FilterValues) => {
  if (values.includes("null")) {
    filteredFeatureCollection.value = { ...props.mapData };
  } else {
    filteredFeatureCollection.value = {
      type: "FeatureCollection",
      features: props.mapData.features.filter((feature) =>
        values.includes(feature.properties?.[props.filterColumn]),
      ),
    };
  }
  addDataToMap();
};

const currentBasemap = ref<Basemap>({ id: "custom", style: props.mapboxStyle });

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

const toggleLayerVisibility = (item: MapLegendItem) => {
  utilsToggleLayerVisibility(map.value, item);
};

const resetToInitialState = () => {
  selectedFeature.value = undefined;
  selectedFeatureOriginal.value = undefined;
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

const handleSidebarClose = () => {
  showSidebar.value = false;
  selectedFeature.value = undefined;
  selectedFeatureOriginal.value = undefined;
  showIntroPanel.value = true;
};

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
      :data="flatDataForFilter"
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
        selectedFeature
          ? getFilePathsWithExtension(
              selectedFeature,
              allowedFileExtensions,
              mediaColumn,
            )
          : []
      "
      :is-alerts-dashboard="false"
      :map-data="flatDataForFilter"
      :map-feature-collection="mapData"
      :map-statistics="mapStatistics"
      :media-base-path="mediaBasePath"
      :show-intro-panel="showIntroPanel"
      :show-sidebar="showSidebar"
      :show-icons="showIcons"
      :can-toggle-icons="canToggleIcons"
      :loading-icons="loadingIcons"
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
