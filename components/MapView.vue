<script setup lang="ts">
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

import { getFilePathsWithExtension } from "@/utils";
import {
  changeMapStyle,
  prepareMapLegendLayers,
  prepareCoordinatesForSelectedFeature,
  toggleLayerVisibility as utilsToggleLayerVisibility,
} from "@/utils/mapFunctions";

import DataFilter from "@/components/shared/DataFilter.vue";
import ViewSidebar from "@/components/shared/ViewSidebar.vue";
import MapLegend from "@/components/shared/MapLegend.vue";
import BasemapSelector from "@/components/shared/BasemapSelector.vue";

import type { Layer, MapMouseEvent } from "mapbox-gl";
import type {
  AllowedFileExtensions,
  Basemap,
  Dataset,
  FilterValues,
  MapLegendItem,
} from "@/types/types";

const props = defineProps<{
  allowedFileExtensions: AllowedFileExtensions;
  filterColumn: string;
  mapLegendLayerIds?: string;
  mapboxAccessToken: string;
  mapboxBearing: number;
  mapboxLatitude: number;
  mapboxLongitude: number;
  mapboxPitch: number;
  mapboxProjection: string;
  mapboxStyle: string;
  mapboxZoom: number;
  mapbox3d: boolean;
  mapData: Dataset;
  mediaBasePath?: string;
  planetApiKey?: string;
}>();

const filteredData = ref([...props.mapData]);
const map = ref();
const selectedFeature = ref();
const showSidebar = ref(false);
const showBasemapSelector = ref(false);

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

    showBasemapSelector.value = true;
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
    map.value.addLayer({
      id: "data-layer-point",
      type: "circle",
      source: "data-source",
      filter: ["==", "$type", "Point"],
      paint: {
        "circle-radius": 8,
        "circle-color": ["get", "filter-color", ["get", "feature"]],
        "circle-stroke-width": 3,
        "circle-stroke-color": "#fff",
      },
    });
  }

  // Add a layer for LineString features if present
  if (hasLineStringFeatures && !map.value.getLayer("data-layer-linestring")) {
    map.value.addLayer({
      id: "data-layer-linestring",
      type: "line",
      source: "data-source",
      filter: ["==", "$type", "LineString"],
      paint: {
        "line-color": ["get", "filter-color", ["get", "feature"]],
        "line-width": 2,
      },
    });
  }

  // Add a layer for Polygon features if present
  if (hasPolygonFeatures && !map.value.getLayer("data-layer-polygon")) {
    map.value.addLayer({
      id: "data-layer-polygon",
      type: "fill",
      source: "data-source",
      filter: ["==", "$type", "Polygon"],
      paint: {
        "fill-color": ["get", "filter-color", ["get", "feature"]],
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
        if (e.features && e.features.length > 0 && e.features[0].properties) {
          const featureObject = JSON.parse(e.features[0].properties.feature);
          delete featureObject["filter-color"];

          // Rewrite coordinates string from [long, lat] to lat, long, removing brackets
          if (featureObject.geocoordinates) {
            featureObject.geocoordinates = prepareCoordinatesForSelectedFeature(
              featureObject.geocoordinates,
            );
          }

          selectedFeature.value = featureObject;
          showSidebar.value = true;
        }
      },
      { passive: true },
    );
  });
};

/** Prepare map canvas content by adding data and legend */
const prepareMapCanvasContent = () => {
  addDataToMap();
  prepareMapLegendContent();
};

const processedData = ref([...props.mapData]);

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

onBeforeUnmount(() => {
  if (map.value) {
    map.value.remove();
  }
});
</script>

<template>
  <div id="map"></div>
  <DataFilter
    v-if="filterColumn"
    :data="mapData"
    :filter-column="filterColumn"
    :show-colored-dot="true"
    @filter="filterValues"
  />
  <ViewSidebar
    :allowed-file-extensions="allowedFileExtensions"
    :feature="selectedFeature"
    :file-paths="
      getFilePathsWithExtension(selectedFeature, allowedFileExtensions)
    "
    :media-base-path="mediaBasePath"
    :show-sidebar="showSidebar"
    @close="showSidebar = false"
  />
  <MapLegend
    v-if="mapLegendContent && mapData"
    :map-legend-content="mapLegendContent"
    @toggle-layer-visibility="toggleLayerVisibility"
  />
  <BasemapSelector
    v-if="showBasemapSelector"
    :mapbox-style="mapboxStyle"
    :planet-api-key="planetApiKey"
    @basemap-selected="handleBasemapChange"
  />
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
</style>
