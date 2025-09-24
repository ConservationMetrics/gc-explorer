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
  AnnotatedCollection,
  Basemap,
  CollectionEntry,
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

// Incidents state
const incidents = ref<AnnotatedCollection[]>([]);
const showIncidents = ref(false);
const showIncidentsSidebar = ref(false);
const selectedIncident = ref<AnnotatedCollection | null>(null);
const selectedIncidentSources = ref<CollectionEntry[]>([]);
const highlightedSourceIds = ref<Set<string>>(new Set());
const selectedSources = ref<Set<string>>(new Set());
const isMultiSelectMode = ref(false);
const _boundingBox = ref<mapboxgl.LngLatBounds | null>(null);
const isCreatingIncident = ref(false);
const newIncident = ref({
  name: '',
  description: '',
  incident_type: '',
  responsible_party: '',
  impact_description: '',
  supporting_evidence: {}
});

const route = useRoute();
const router = useRouter();

const isMapeo = ref(false);

// ========================
// === Incidents API ====
// ========================

/**
 * Fetches all incidents from the API and updates the incidents state
 * @async
 * @function fetchIncidents
 * @returns {Promise<void>} Promise that resolves when incidents are fetched
 */
const fetchIncidents = async () => {
  try {
    const response = await $fetch('/api/incidents') as { incidents: AnnotatedCollection[] };
    incidents.value = response.incidents || [];
  } catch (error) {
    console.error('Error fetching incidents:', error);
  }
};

/**
 * Fetches detailed incident data including sources and updates component state
 * @async
 * @function fetchIncidentDetails
 * @param {string} incidentId - The unique identifier of the incident
 * @returns {Promise<{collection: AnnotatedCollection, entries: CollectionEntry[]} | null>} Promise that resolves with incident details or null if error
 */
const fetchIncidentDetails = async (incidentId: string) => {
  try {
    const response = await $fetch(`/api/collections/${incidentId}`) as {
      collection: AnnotatedCollection;
      entries: CollectionEntry[];
    };
    selectedIncident.value = response.collection;
    selectedIncidentSources.value = response.entries || [];
    return response;
  } catch (error) {
    console.error('Error fetching incident details:', error);
    return null;
  }
};

/**
 * Creates a new incident with selected sources and refreshes the incidents list
 * @async
 * @function createIncident
 * @param {Object} incidentData - The incident data to create
 * @param {string} incidentData.name - The name of the incident
 * @param {string} [incidentData.description] - Optional description of the incident
 * @param {string} [incidentData.incident_type] - Optional type of incident (deforestation, mining, etc.)
 * @param {string} [incidentData.responsible_party] - Optional responsible party
 * @param {string} [incidentData.impact_description] - Optional impact description
 * @param {Record<string, unknown>} [incidentData.supporting_evidence] - Optional supporting evidence
 * @returns {Promise<any>} Promise that resolves with the created incident response
 * @throws {Error} Throws error if incident creation fails
 */
const createIncident = async (incidentData: {
  name: string;
  description?: string;
  incident_type?: string;
  responsible_party?: string;
  impact_description?: string;
  supporting_evidence?: Record<string, unknown>;
}) => {
  try {
    const sources = Array.from(selectedSources.value).map(sourceId => ({
      source_table: 'fake_alerts', // TODO: Determine table dynamically
      source_id: sourceId,
      notes: 'Selected from map'
    }));

    const response = await $fetch('/api/incidents', {
      method: 'POST',
      body: {
        ...incidentData,
        entries: sources
      }
    });

    // Refresh incidents list
    await fetchIncidents();
    
    // Clear selected sources
    selectedSources.value.clear();
    isCreatingIncident.value = false;
    
    return response;
  } catch (error) {
    console.error('Error creating incident:', error);
    throw error;
  }
};

// ========================
// === Incidents UI ====
// ========================

/**
 * Toggles the incidents view and highlights incident sources on the map
 * @async
 * @function toggleIncidentsView
 * @returns {Promise<void>} Promise that resolves when incidents view is toggled
 */
const toggleIncidentsView = async () => {
  showIncidents.value = !showIncidents.value;
  
  if (showIncidents.value) {
    // Show incidents sidebar
    showIncidentsSidebar.value = true;
    
    // Highlight all incident sources
    await highlightAllIncidentSources();
  } else {
    // Hide incidents sidebar
    showIncidentsSidebar.value = false;
    selectedIncident.value = null;
    selectedIncidentSources.value = [];
    
    // Clear all highlighting
    clearAllHighlighting();
  }
};

/**
 * Highlights all sources from all incidents on the map
 * @async
 * @function highlightAllIncidentSources
 * @returns {Promise<void>} Promise that resolves when all incident sources are highlighted
 */
const highlightAllIncidentSources = async () => {
  highlightedSourceIds.value.clear();
  
  // Collect all source IDs from all incidents
  for (const incident of incidents.value) {
    const details = await fetchIncidentDetails(incident.id);
    if (details?.entries) {
      details.entries.forEach((entry: CollectionEntry) => {
        highlightedSourceIds.value.add(entry.source_id);
      });
    }
  }
  
  // Apply highlighting to map
  applySourceHighlighting();
};

/**
 * Highlights sources for a specific incident and updates the selected incident state
 * @async
 * @function highlightIncidentSources
 * @param {AnnotatedCollection} incident - The incident to highlight sources for
 * @returns {Promise<void>} Promise that resolves when incident sources are highlighted
 */
const highlightIncidentSources = async (incident: AnnotatedCollection) => {
  selectedIncident.value = incident;
  const details = await fetchIncidentDetails(incident.id);
  
  if (details?.entries) {
    selectedIncidentSources.value = details.entries;
    highlightedSourceIds.value.clear();
    
    details.entries.forEach((entry: CollectionEntry) => {
      highlightedSourceIds.value.add(entry.source_id);
    });
    
    applySourceHighlighting();
  }
};

/**
 * Applies yellow highlighting to sources on the map using Mapbox filters
 * @function applySourceHighlighting
 * @returns {void}
 */
const applySourceHighlighting = () => {
  if (!map.value) return;
  
  // Update all alert layers to highlight selected sources
  const layers = [
    'most-recent-alerts-polygon',
    'most-recent-alerts-linestring', 
    'most-recent-alerts-point',
    'previous-alerts-polygon',
    'previous-alerts-linestring',
    'previous-alerts-point'
  ];
  
  layers.forEach(layerId => {
    if (map.value.getLayer(layerId)) {
      // Set filter to highlight only selected sources
      const sourceIds = Array.from(highlightedSourceIds.value);
      if (sourceIds.length > 0) {
        map.value.setFilter(layerId, [
          'in',
          ['get', '_id'],
          ['literal', sourceIds]
        ]);
      } else {
        map.value.setFilter(layerId, null);
      }
    }
  });
};

/**
 * Clears all source highlighting and resets map layer filters
 * @function clearAllHighlighting
 * @returns {void}
 */
const clearAllHighlighting = () => {
  highlightedSourceIds.value.clear();
  selectedSources.value.clear();
  
  if (!map.value) return;
  
  // Reset all layer filters
  const layers = [
    'most-recent-alerts-polygon',
    'most-recent-alerts-linestring', 
    'most-recent-alerts-point',
    'previous-alerts-polygon',
    'previous-alerts-linestring',
    'previous-alerts-point'
  ];
  
  layers.forEach(layerId => {
    if (map.value.getLayer(layerId)) {
      map.value.setFilter(layerId, null);
    }
  });
};

// ========================
// === Multi-Select ====
// ========================

/**
 * Starts creating a new incident with multi-select mode enabled
 * @function startCreatingIncident
 * @returns {void}
 */
const startCreatingIncident = () => {
  isCreatingIncident.value = true;
  isMultiSelectMode.value = true;
  selectedSources.value.clear();
  
  // Add event listeners for multi-select
  setupMultiSelectListeners();
  
  // Show instructions
  console.log('Multi-select mode enabled. Hold Ctrl and click features to select them, or drag to create a bounding box.');
};

/**
 * Sets up event listeners for multi-select functionality (Ctrl+click and bounding box)
 * @function setupMultiSelectListeners
 * @returns {void}
 */
const setupMultiSelectListeners = () => {
  if (!map.value) return;
  
  // Enable box selection
  map.value.boxZoom.enable();
  
  // Add Ctrl+click handler
  map.value.on('click', handleMultiSelectClick);
  
  // Add box selection handler
  map.value.on('boxzoomend', handleBoxSelection);
};

/**
 * Handles Ctrl+click events for multi-select functionality
 * @function handleMultiSelectClick
 * @param {MapMouseEvent} e - The map mouse event
 * @returns {void}
 */
const handleMultiSelectClick = (e: MapMouseEvent) => {
  if (!isMultiSelectMode.value || !e.originalEvent.ctrlKey) return;
  
  e.preventDefault();
  
  // Query features at click point
  const features = map.value.queryRenderedFeatures(e.point, {
    layers: [
      'most-recent-alerts-polygon',
      'most-recent-alerts-linestring', 
      'most-recent-alerts-point',
      'previous-alerts-polygon',
      'previous-alerts-linestring',
      'previous-alerts-point'
    ]
  });
  
  if (features.length > 0) {
    const feature = features[0];
    const sourceId = feature.properties?._id || feature.properties?.id;
    
    if (sourceId) {
      if (selectedSources.value.has(sourceId)) {
        selectedSources.value.delete(sourceId);
      } else {
        selectedSources.value.add(sourceId);
      }
      
      // Update visual feedback
      updateSelectedSourcesHighlighting();
    }
  }
};

/**
 * Handles bounding box selection for multi-select functionality
 * @function handleBoxSelection
 * @param {{ boxZoomBounds: mapboxgl.LngLatBounds }} e - Event object containing bounding box bounds
 * @returns {void}
 */
const handleBoxSelection = (e: { boxZoomBounds: mapboxgl.LngLatBounds }) => {
  if (!isMultiSelectMode.value) return;
  
  const bbox = e.boxZoomBounds;
  
  // Query features within bounding box
  const features = map.value.queryRenderedFeatures([
    [bbox.getWest(), bbox.getSouth()],
    [bbox.getEast(), bbox.getNorth()]
  ], {
    layers: [
      'most-recent-alerts-polygon',
      'most-recent-alerts-linestring', 
      'most-recent-alerts-point',
      'previous-alerts-polygon',
      'previous-alerts-linestring',
      'previous-alerts-point'
    ]
  });
  
  // Add all features to selection
  features.forEach((feature: { properties?: { _id?: string; id?: string } }) => {
    const sourceId = feature.properties?._id || feature.properties?.id;
    if (sourceId) {
      selectedSources.value.add(sourceId);
    }
  });
  
  // Update visual feedback
  updateSelectedSourcesHighlighting();
  
  // Disable box zoom after selection
  map.value.boxZoom.disable();
};

/**
 * Updates highlighting for selected sources on the map
 * @function updateSelectedSourcesHighlighting
 * @returns {void}
 */
const updateSelectedSourcesHighlighting = () => {
  if (!map.value) return;
  
  const sourceIds = Array.from(selectedSources.value);
  
  // Update all alert layers to highlight selected sources
  const layers = [
    'most-recent-alerts-polygon',
    'most-recent-alerts-linestring', 
    'most-recent-alerts-point',
    'previous-alerts-polygon',
    'previous-alerts-linestring',
    'previous-alerts-point'
  ];
  
  layers.forEach(layerId => {
    if (map.value.getLayer(layerId)) {
      if (sourceIds.length > 0) {
        map.value.setFilter(layerId, [
          'in',
          ['get', '_id'],
          ['literal', sourceIds]
        ]);
      } else {
        map.value.setFilter(layerId, null);
      }
    }
  });
};

/**
 * Cleans up multi-select event listeners and disables box zoom
 * @function cleanupMultiSelectListeners
 * @returns {void}
 */
const cleanupMultiSelectListeners = () => {
  if (!map.value) return;
  
  map.value.off('click', handleMultiSelectClick);
  map.value.off('boxzoomend', handleBoxSelection);
  map.value.boxZoom.disable();
};

// ========================
// === Incident Creation ====
// ========================

/**
 * Submits the incident creation form and handles the creation process
 * @async
 * @function submitIncident
 * @returns {Promise<void>} Promise that resolves when incident is created
 * @throws {Error} Throws error if incident creation fails
 */
const submitIncident = async () => {
  try {
    await createIncident(newIncident.value);
    
    // Reset form
    resetIncidentForm();
    
    // Clean up multi-select
    cleanupMultiSelectListeners();
    isMultiSelectMode.value = false;
    
    // Show success message
    console.log('Incident created successfully!');
    
  } catch (error) {
    console.error('Error creating incident:', error);
    // TODO: Show error message to user
  }
};

/**
 * Cancels incident creation and resets all related state
 * @function cancelIncidentCreation
 * @returns {void}
 */
const cancelIncidentCreation = () => {
  resetIncidentForm();
  cleanupMultiSelectListeners();
  isMultiSelectMode.value = false;
  isCreatingIncident.value = false;
  clearAllHighlighting();
};

/**
 * Resets the incident creation form and clears selected sources
 * @function resetIncidentForm
 * @returns {void}
 */
const resetIncidentForm = () => {
  newIncident.value = {
    name: '',
    description: '',
    incident_type: '',
    responsible_party: '',
    impact_description: '',
    supporting_evidence: {}
  };
  selectedSources.value.clear();
  isCreatingIncident.value = false;
};

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

onMounted(async () => {
  // Fetch incidents on load
  await fetchIncidents();
  
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
    });

    // Handle pulsing circles for most-recent-alerts
    if (item.id === "most-recent-alerts") {
      if (item.visible) {
        // Layer is being made visible - add pulsing circles
        addPulsingCircles();
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
  downloadAlert.value = true;

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
    // Use our custom toggle function to ensure all related layers are made visible
    toggleLayerVisibility({ ...item, visible: true });
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
  // Clean up multi-select listeners
  cleanupMultiSelectListeners();
  
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
    <button
      class="incidents-button bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
      :class="{ 'bg-green-700': showIncidents }"
      @click="toggleIncidentsView"
    >
      {{ showIncidents ? 'Hide Incidents' : 'View Incidents' }}
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
    
    <!-- Incidents Right Sidebar -->
    <div
      v-if="showIncidentsSidebar"
      class="incidents-sidebar"
    >
      <div class="incidents-header">
        <h3>Incidents</h3>
        <button
          class="close-button"
          @click="showIncidentsSidebar = false; showIncidents = false; clearAllHighlighting()"
        >
          ×
        </button>
      </div>
      
      <div class="incidents-content">
        <!-- Create New Incident Button -->
        <button
          v-if="!isCreatingIncident"
          class="create-incident-btn bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mb-4 w-full"
          @click="startCreatingIncident"
        >
          Create New Incident
        </button>
        
        <!-- Incident Creation Form -->
        <div
          v-if="isCreatingIncident"
          class="incident-creation-form"
        >
          <h4>Create New Incident</h4>
          <p class="selection-info">
            Selected Sources: {{ selectedSources.size }}
            <br />
            <small>Hold Ctrl and click features to select them, or drag to create a bounding box.</small>
          </p>
          
          <form @submit.prevent="submitIncident">
            <div class="form-group">
              <label for="incident-name">Incident Name *</label>
              <input
                id="incident-name"
                v-model="newIncident.name"
                type="text"
                required
                class="form-input"
                placeholder="Enter incident name"
              />
            </div>
            
            <div class="form-group">
              <label for="incident-description">Description</label>
              <textarea
                id="incident-description"
                v-model="newIncident.description"
                class="form-textarea"
                placeholder="Enter incident description"
                rows="3"
              ></textarea>
            </div>
            
            <div class="form-group">
              <label for="incident-type">Incident Type</label>
              <select
                id="incident-type"
                v-model="newIncident.incident_type"
                class="form-select"
              >
                <option value="">Select type</option>
                <option value="deforestation">Deforestation</option>
                <option value="mining">Mining</option>
                <option value="illegal_activity">Illegal Activity</option>
                <option value="fire">Fire</option>
                <option value="other">Other</option>
              </select>
            </div>
            
            <div class="form-group">
              <label for="responsible-party">Responsible Party</label>
              <input
                id="responsible-party"
                v-model="newIncident.responsible_party"
                type="text"
                class="form-input"
                placeholder="Enter responsible party"
              />
            </div>
            
            <div class="form-group">
              <label for="impact-description">Impact Description</label>
              <textarea
                id="impact-description"
                v-model="newIncident.impact_description"
                class="form-textarea"
                placeholder="Describe the impact"
                rows="3"
              ></textarea>
            </div>
            
            <div class="form-actions">
              <button
                type="button"
                class="btn-cancel"
                @click="cancelIncidentCreation"
              >
                Cancel
              </button>
              <button
                type="submit"
                class="btn-save"
                :disabled="selectedSources.size === 0 || !newIncident.name"
              >
                Save Incident
              </button>
            </div>
          </form>
        </div>
        
        <!-- Incidents List -->
        <div class="incidents-list">
          <div
            v-for="incident in incidents"
            :key="incident.id"
            class="incident-item"
            :class="{ 'selected': selectedIncident?.id === incident.id }"
            @click="highlightIncidentSources(incident)"
          >
            <h4>{{ incident.name }}</h4>
            <p class="incident-description">{{ incident.description }}</p>
            <div class="incident-meta">
              <span class="incident-type">{{ incident.metadata?.incident_type || 'Unknown' }}</span>
              <span class="incident-date">{{ new Date(incident.created_at).toLocaleDateString() }}</span>
            </div>
          </div>
        </div>
        
        <!-- Selected Incident Details -->
        <div
          v-if="selectedIncident"
          class="selected-incident-details"
        >
          <h4>Sources ({{ selectedIncidentSources.length }})</h4>
          <div class="sources-list">
            <div
              v-for="source in selectedIncidentSources"
              :key="source.id"
              class="source-item"
            >
              <span class="source-id">{{ source.source_id }}</span>
              <span class="source-table">{{ source.source_table }}</span>
              <p v-if="source.notes" class="source-notes">{{ source.notes }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
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

.incidents-button {
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 10;
}

.incidents-sidebar {
  position: absolute;
  top: 0;
  right: 0;
  width: 350px;
  height: 100vh;
  background: white;
  border-left: 1px solid #ddd;
  box-shadow: -2px 0 10px rgba(0, 0, 0, 0.1);
  z-index: 1000;
  overflow-y: auto;
  transform: translateX(0);
  transition: transform 0.3s ease-in-out;
}

.incidents-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #eee;
  background: #f8f9fa;
}

.incidents-header h3 {
  margin: 0;
  color: #333;
}

.close-button {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #666;
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-button:hover {
  color: #333;
}

.incidents-content {
  padding: 20px;
}

.incidents-list {
  margin-bottom: 20px;
}

.incident-item {
  padding: 15px;
  border: 1px solid #eee;
  border-radius: 8px;
  margin-bottom: 10px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.incident-item:hover {
  border-color: #007bff;
  background: #f8f9fa;
}

.incident-item.selected {
  border-color: #007bff;
  background: #e3f2fd;
}

.incident-item h4 {
  margin: 0 0 8px 0;
  color: #333;
  font-size: 16px;
}

.incident-description {
  margin: 0 0 10px 0;
  color: #666;
  font-size: 14px;
  line-height: 1.4;
}

.incident-meta {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #888;
}

.incident-type {
  background: #e9ecef;
  padding: 2px 8px;
  border-radius: 12px;
}

.selected-incident-details {
  border-top: 1px solid #eee;
  padding-top: 20px;
}

.selected-incident-details h4 {
  margin: 0 0 15px 0;
  color: #333;
}

.sources-list {
  max-height: 200px;
  overflow-y: auto;
}

.source-item {
  padding: 10px;
  background: #f8f9fa;
  border-radius: 6px;
  margin-bottom: 8px;
  font-size: 14px;
}

.source-id {
  font-weight: bold;
  color: #007bff;
  display: block;
}

.source-table {
  color: #666;
  font-size: 12px;
}

.source-notes {
  margin: 5px 0 0 0;
  color: #666;
  font-style: italic;
  font-size: 12px;
}

.incident-creation-form {
  background: #f8f9fa;
  border: 1px solid #dee2e6;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
}

.incident-creation-form h4 {
  margin: 0 0 15px 0;
  color: #333;
}

.selection-info {
  background: #e3f2fd;
  border: 1px solid #bbdefb;
  border-radius: 6px;
  padding: 10px;
  margin-bottom: 20px;
  font-size: 14px;
  color: #1976d2;
}

.selection-info small {
  color: #666;
  font-size: 12px;
}

.form-group {
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: 500;
  color: #333;
  font-size: 14px;
}

.form-input,
.form-textarea,
.form-select {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  transition: border-color 0.2s ease;
}

.form-input:focus,
.form-textarea:focus,
.form-select:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
}

.form-textarea {
  resize: vertical;
  min-height: 60px;
}

.form-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  margin-top: 20px;
}

.btn-cancel,
.btn-save {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.btn-cancel {
  background: #6c757d;
  color: white;
}

.btn-cancel:hover {
  background: #5a6268;
}

.btn-save {
  background: #28a745;
  color: white;
}

.btn-save:hover:not(:disabled) {
  background: #218838;
}

.btn-save:disabled {
  background: #6c757d;
  cursor: not-allowed;
}
</style>
