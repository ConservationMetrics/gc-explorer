import { ref } from "vue";
import type { RouteLocationNormalizedLoaded, Router } from "vue-router";
import type mapboxgl from "mapbox-gl";
import { along, length, lineString } from "@turf/turf";
import type { Feature } from "geojson";
import type { AlertsData } from "@/types/types";
import { prepareCoordinatesForSelectedFeature } from "@/utils/mapFunctions";

export function useFeatureSelection(
  map: Ref<mapboxgl.Map | undefined>,
  route: RouteLocationNormalizedLoaded,
  router: Router,
  localAlertsData: Ref<Feature | AlertsData>,
  showSidebar: Ref<boolean>,
  showIntroPanel: Ref<boolean>,
  isMapeo: Ref<boolean>,
) {
  // Feature selection state
  const imageCaption = ref();
  const imageUrl = ref<string[]>([]);
  const isAlert = ref(false);
  const selectedFeature = ref();
  const selectedFeatureId = ref<string | number | null>(null);
  const selectedFeatureSource = ref<string | null>(null);
  const selectedFeatureGeometry = ref<Feature["geometry"] | null>(null); // Store geometry separately for cluster highlighting
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
    if (!map.value) return null;

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
      if (map.value!.getLayer(clustersLayer)) {
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

        map.value!.setPaintProperty(
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
    if (!map.value) return;
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
      layers: [clusterLayerName].filter((id) => map.value!.getLayer(id)),
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
    if (!map.value) return;
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

    // Update URL with alertId or mapeoDocId; remove incidentId so address bar matches "copy link to alert"
    const query = { ...route.query };
    delete query.alertId;
    delete query.mapeoDocId;
    delete query.incidentId;
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
      const companionLayer = getCompanionLayerId(
        layerId,
        featureObject.alertID,
      );
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
    if (!map.value) return;
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
   * Calculates the centroid of a LineString for zooming purposes
   */
  const calculateLineStringCentroid = (coordinates: number[][]) => {
    const line = lineString(coordinates);
    const lineLength = length(line, { units: "kilometers" });
    const midpoint = along(line, lineLength / 2, { units: "kilometers" });
    return midpoint.geometry.coordinates;
  };

  return {
    // State
    imageCaption,
    imageUrl,
    isAlert,
    selectedFeature,
    selectedFeatureId,
    selectedFeatureSource,
    selectedFeatureGeometry,
    selectedClusterId,
    selectedClusterSource,
    // Functions
    getCompanionLayerId,
    updateClusterHighlight,
    highlightClusterContainingFeature,
    selectFeature,
    resetSelectedFeature,
    calculateLineStringCentroid,
  };
}
