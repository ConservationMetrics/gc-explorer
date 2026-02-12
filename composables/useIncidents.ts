import { computed, onBeforeUnmount, ref } from "vue";
import type { RouteLocationNormalizedLoaded, Router } from "vue-router";
import mapboxgl from "mapbox-gl";
import type { Feature } from "geojson";
import type {
  AnnotatedCollection,
  CollectionEntry,
  Incident,
} from "@/types/types";

/**
 * Small in-memory cache to avoid refetching incident details repeatedly.
 * (Also used for hover-prefetch.)
 */
type IncidentDetailsResponse = {
  incident: AnnotatedCollection;
  incidentData?: Incident;
  entries: CollectionEntry[];
};

/**
 * Composable for managing incidents functionality in the alerts dashboard.
 *
 * Handles all incidents-related state and operations including:
 * - Fetching and paginating incidents list from the API
 * - Creating new incidents with selected map features
 * - Managing incident detail views and caching
 * - Multi-select and bounding box selection modes for feature selection
 * - Highlighting selected features on the map
 * - Managing incidents sidebar visibility and state
 *
 * @param map - Ref to the Mapbox map instance for feature highlighting and selection
 * @param route - Vue Router route object for accessing route parameters (e.g., table name)
 * @param router - Vue Router instance for programmatic navigation and query param management
 * @param apiKey - API key for authenticating requests to the incidents API
 * @returns Object containing all incidents state and functions
 */
export const useIncidents = (
  map: Ref<mapboxgl.Map | undefined>,
  route: RouteLocationNormalizedLoaded,
  router: Router,
  apiKey: string,
  mapLegendLayerIds?: Ref<string | undefined>,
) => {
  // Incidents state management
  const incidents = ref<AnnotatedCollection[]>([]);
  const incidentsTotal = ref(0);
  const incidentsLimit = ref(20);
  const isLoadingMoreIncidents = ref(false);

  const showIncidentsSidebar = ref(false);
  const openSidebarWithCreateForm = ref(false);
  const selectedSources = ref<
    Array<{ source_table: string; source_id: string; notes?: string }>
  >([]);
  const isCreatingIncident = ref(false);
  const multiSelectMode = ref(false);
  const boundingBoxMode = ref(false);
  const isLoadingIncidents = ref(false);

  // Selected incident detail view state
  const selectedIncident = ref<AnnotatedCollection | null>(null);
  const selectedIncidentData = ref<Incident | null>(null);
  const selectedIncidentEntries = ref<CollectionEntry[]>([]);
  const isLoadingSelectedIncident = ref(false);

  // Tooltip state
  const hoveredButton = ref<
    | "incidents"
    | "boundingBox"
    | "multiSelect"
    | "createIncident"
    | "deselect"
    | null
  >(null);

  // Highlighted sources tracking
  const highlightedSources = ref<
    Array<{
      featureId: string | number;
      layerId: string;
      sourceId: string;
      sourceLayer?: string;
    }>
  >([]);

  // Cluster highlighting state: multiple clusters per source (e.g. bbox over many clusters)
  const incidentClusterIds = ref<Map<string, Set<number | string>>>(new Map()); // sourceName -> Set of clusterIds

  // Incident details cache
  const incidentDetailsCache = new Map<string, IncidentDetailsResponse>();
  const incidentDetailsInFlight = new Map<
    string,
    Promise<IncidentDetailsResponse>
  >();

  let incidentPrefetchTimeout: ReturnType<typeof setTimeout> | null = null;

  const getAdditionalSelectableLayerIds = () =>
    (mapLegendLayerIds?.value || "")
      .split(",")
      .map((layerId) => layerId.trim())
      .filter(Boolean);

  const isAdditionalSelectableLayer = (layerId: string) => {
    const additionalLayerIds = getAdditionalSelectableLayerIds();
    return (
      additionalLayerIds.includes(layerId) ||
      (layerId.endsWith("-stroke") &&
        additionalLayerIds.includes(layerId.replace(/-stroke$/i, "")))
    );
  };

  const resolveFeatureStateTarget = (feature: Feature, layerId: string) => {
    if (!map.value) return null;

    const mapLayer = map.value.getLayer(layerId) as
      | (mapboxgl.AnyLayer & { source?: string; "source-layer"?: string })
      | undefined;

    const sourceId = mapLayer?.source || layerId;
    const sourceLayer = mapLayer?.["source-layer"];
    const featureId = layerId.includes("-centroids")
      ? feature.properties?.alertID
      : (feature.id ??
        feature.properties?.alertID ??
        feature.properties?._id ??
        feature.properties?.id);

    if (featureId === undefined || featureId === null || !sourceId) {
      return null;
    }

    return { sourceId, sourceLayer, featureId };
  };

  /**
   * Fetches incidents from the API (paginated)
   */
  const fetchIncidents = async (
    options: { offset?: number; append?: boolean } = {},
  ) => {
    const offset = options.offset ?? 0;
    const append = options.append ?? false;

    if (append) {
      isLoadingMoreIncidents.value = true;
    } else {
      isLoadingIncidents.value = true;
    }

    try {
      const response = await $fetch<{
        incidents: AnnotatedCollection[];
        total: number;
        limit: number;
        offset: number;
      }>("/api/incidents", {
        query: {
          limit: incidentsLimit.value,
          offset,
        },
        headers: {
          "x-api-key": apiKey,
        },
      });

      incidentsTotal.value = response.total;
      incidentsLimit.value = response.limit;

      incidents.value = append
        ? [...incidents.value, ...response.incidents]
        : response.incidents;
    } catch (error) {
      console.error("Error fetching incidents:", error);
    } finally {
      if (append) {
        isLoadingMoreIncidents.value = false;
      } else {
        isLoadingIncidents.value = false;
      }
    }
  };

  const hasMoreIncidents = computed(
    () => incidents.value.length < incidentsTotal.value,
  );

  const loadMoreIncidents = async () => {
    if (isLoadingIncidents.value || isLoadingMoreIncidents.value) {
      return;
    }

    if (!hasMoreIncidents.value) {
      return;
    }

    await fetchIncidents({ offset: incidents.value.length, append: true });
  };

  /**
   * Clears selected incident detail view and its map highlighting
   */
  const clearSelectedIncident = () => {
    selectedIncident.value = null;
    selectedIncidentData.value = null;
    selectedIncidentEntries.value = [];
    // Remove incidentId from URL when going back to incidents list
    const query = { ...route.query };
    delete query.incidentId;
    router.replace({ query });
    clearSourceHighlighting();

    // Clear cluster highlighting
    incidentClusterIds.value.clear();
    updateIncidentClusterHighlight();
  };

  const getIncidentDetails = async (
    incidentId: string,
  ): Promise<IncidentDetailsResponse> => {
    const cached = incidentDetailsCache.get(incidentId);
    if (cached) {
      return cached;
    }

    const inFlight = incidentDetailsInFlight.get(incidentId);
    if (inFlight) {
      return inFlight;
    }

    const promise = $fetch<IncidentDetailsResponse>(
      `/api/incidents/${incidentId}`,
      {
        headers: {
          "x-api-key": apiKey,
        },
      },
    )
      .then((response) => {
        incidentDetailsCache.set(incidentId, response);
        incidentDetailsInFlight.delete(incidentId);
        return response;
      })
      .catch((error) => {
        incidentDetailsInFlight.delete(incidentId);
        throw error;
      });

    incidentDetailsInFlight.set(incidentId, promise);
    return promise;
  };

  const scheduleIncidentPrefetch = (incidentId: string) => {
    if (incidentPrefetchTimeout) {
      clearTimeout(incidentPrefetchTimeout);
    }

    incidentPrefetchTimeout = setTimeout(() => {
      void getIncidentDetails(incidentId).catch(() => {
        // Best-effort prefetch only.
      });
    }, 400);
  };

  /**
   * Opens a saved incident in the sidebar and highlights its entries on the map
   */
  const openIncidentDetails = async (incidentId: string) => {
    isLoadingSelectedIncident.value = true;

    try {
      const response = await getIncidentDetails(incidentId);

      // Ensure create form state is reset when viewing an existing incident
      openSidebarWithCreateForm.value = false;
      showIncidentsSidebar.value = true;

      selectedIncident.value = response.incident;
      selectedIncidentData.value = response.incidentData || null;
      selectedIncidentEntries.value = response.entries || [];

      // Viewing a saved incident should not be mixed with create-selection mode
      selectedSources.value = [];

      clearSourceHighlighting();
      highlightIncidentEntries(response.entries || []);

      // Add incidentId to URL; remove alert/mapeo params so address bar matches "copy link to incident"
      const query = { ...route.query };
      delete query.alertId;
      delete query.mapeoDocId;
      query.incidentId = incidentId;
      router.replace({ query });
    } catch (error) {
      console.error("Error fetching incident details:", error);
    } finally {
      isLoadingSelectedIncident.value = false;
    }
  };

  /**
   * Creates a new incident with selected sources
   * @param incidentData - Incident data including name, description, type, responsible party, impact, and evidence
   * @returns Promise<void>
   */
  const createIncident = async (incidentData: {
    name: string;
    description?: string;
    incident_type?: string;
    responsible_party?: string;
    impact_description?: string;
    supporting_evidence?: Record<string, unknown>;
  }) => {
    if (selectedSources.value.length === 0) {
      throw new Error(
        "Cannot create incident without selected alerts. Select at least one alert.",
      );
    }
    isCreatingIncident.value = true;
    try {
      const response = await $fetch<{ incident: AnnotatedCollection }>(
        "/api/incidents",
        {
          method: "POST",
          headers: {
            "x-api-key": apiKey,
            "Content-Type": "application/json",
          },
          body: {
            ...incidentData,
            entries: selectedSources.value,
          },
        },
      );

      // Refresh incidents list
      await fetchIncidents();
      // Clear selected sources after successful creation
      selectedSources.value = [];
      clearSourceHighlighting();
      // Reset the create form flag
      openSidebarWithCreateForm.value = false;
      return response.incident;
    } catch (error) {
      console.error("Error creating incident:", error);
      throw error;
    } finally {
      isCreatingIncident.value = false;
    }
  };

  /**
   * Toggles the incidents sidebar visibility
   * Clears all selections when closing only if they were opened via "Create Incident" button
   * If no sources are selected, it's safe to open (user is just viewing saved incidents)
   * @returns void
   */
  const toggleIncidentsSidebar = () => {
    const wasOpen = showIncidentsSidebar.value;
    const hadCreateFormOpen = openSidebarWithCreateForm.value;
    const hasSelectedSources = selectedSources.value.length > 0;
    const hadIncidentDetailOpen = selectedIncident.value !== null;

    // Toggle sidebar
    showIncidentsSidebar.value = !showIncidentsSidebar.value;

    // Remove incidentId from URL when closing sidebar
    if (wasOpen && !showIncidentsSidebar.value) {
      const query = { ...route.query };
      delete query.incidentId;
      router.replace({ query });
    }

    // Reset create form flag when toggling
    if (!showIncidentsSidebar.value || !hadCreateFormOpen) {
      openSidebarWithCreateForm.value = false;
    }

    // If closing the sidebar after opening with create form AND there are selected sources, clear all selections
    // If no sources were selected, it's safe to open/close without clearing (just viewing saved incidents)
    if (
      wasOpen &&
      !showIncidentsSidebar.value &&
      hadCreateFormOpen &&
      hasSelectedSources
    ) {
      clearSelectedSources();
      clearSourceHighlighting();
    }

    // If closing from an incident detail view, clear that view and its highlighting
    if (wasOpen && !showIncidentsSidebar.value && hadIncidentDetailOpen) {
      clearSelectedIncident();
    }
  };

  /**
   * Opens the incidents sidebar with the create form
   * Only works if there are selected sources
   * @returns void
   */
  const openIncidentsSidebarWithCreateForm = () => {
    if (selectedSources.value.length === 0) {
      return; // Don't open if no sources selected
    }

    // Make sure we are not in detail view
    selectedIncident.value = null;
    selectedIncidentData.value = null;
    selectedIncidentEntries.value = [];

    openSidebarWithCreateForm.value = true;
    showIncidentsSidebar.value = true;
  };

  /**
   * Toggles multi-select mode for selecting multiple features
   * Cleans up bounding box handlers if they were active
   */
  const toggleMultiSelectMode = () => {
    const wasBoundingBoxActive = boundingBoxMode.value;
    multiSelectMode.value = !multiSelectMode.value;
    boundingBoxMode.value = false;

    // If bounding box was active, clean up its handlers
    if (wasBoundingBoxActive) {
      if (map.value) {
        map.value.dragRotate.enable();
      }
      removeBoundingBoxHandlers();
    }
  };

  /**
   * Toggles bounding box mode for selecting features within a drawn area
   */
  const toggleBoundingBoxMode = () => {
    boundingBoxMode.value = !boundingBoxMode.value;
    multiSelectMode.value = false;

    if (boundingBoxMode.value) {
      if (map.value) {
        map.value.dragRotate.disable();
      }
      setupCustomBoundingBox();
    } else {
      if (map.value) {
        map.value.dragRotate.enable();
      }
      removeBoundingBoxHandlers();
    }
  };

  /**
   * Sets up custom bounding box selection while bbox mode is active
   * Creates a visual selection box and selects features within it
   */
  const setupCustomBoundingBox = () => {
    if (!map.value) return;

    const canvas = map.value.getCanvasContainer();
    let start: mapboxgl.Point | null = null;
    let current: mapboxgl.Point | null = null;
    let box: HTMLElement | null = null;

    // Add CSS for the selection box
    if (!document.getElementById("bounding-box-styles")) {
      const style = document.createElement("style");
      style.id = "bounding-box-styles";
      style.textContent = `
      .boxdraw {
        background: rgba(56, 135, 190, 0.1);
        border: 2px solid #3887be;
        position: absolute;
        top: 0;
        left: 0;
        width: 0;
        height: 0;
        pointer-events: none;
        z-index: 1000;
      }
    `;
      document.head.appendChild(style);
    }

    /**
     * Returns the xy coordinates of the mouse position relative to the canvas
     */
    const mousePos = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      return new mapboxgl.Point(
        e.clientX - rect.left - canvas.clientLeft,
        e.clientY - rect.top - canvas.clientTop,
      );
    };

    /**
     * Handles mouse down event to start bounding box selection
     */
    const mouseDownForBoundingBox = (e: MouseEvent) => {
      if (e.button !== 0) return;

      map.value!.dragPan.disable();

      document.addEventListener("mousemove", onMouseMoveDuringBoundingBox);
      document.addEventListener("mouseup", onMouseUpDuringBoundingBox);
      document.addEventListener("keydown", onKeyDownDuringBoundingBox);

      start = mousePos(e);
    };

    /**
     * Handles mouse move to draw the selection box
     */
    const onMouseMoveDuringBoundingBox = (e: MouseEvent) => {
      if (!start) return;

      current = mousePos(e);

      if (!box) {
        box = document.createElement("div");
        box.classList.add("boxdraw");
        canvas.appendChild(box);
      }

      const minX = Math.min(start.x, current.x);
      const maxX = Math.max(start.x, current.x);
      const minY = Math.min(start.y, current.y);
      const maxY = Math.max(start.y, current.y);

      const pos = `translate(${minX}px, ${minY}px)`;
      box.style.transform = pos;
      box.style.width = maxX - minX + "px";
      box.style.height = maxY - minY + "px";
    };

    /**
     * Handles mouse up to finish bounding box selection
     */
    const onMouseUpDuringBoundingBox = (e: MouseEvent) => {
      if (!start) return;

      finishBoundingBox([start, mousePos(e)]);
    };

    /**
     * Handles key down to cancel bounding box selection on ESC
     */
    const onKeyDownDuringBoundingBox = (e: KeyboardEvent) => {
      if (e.keyCode === 27) finishBoundingBox();
    };

    /**
     * Finishes the bounding box selection and queries features
     */
    const finishBoundingBox = async (
      bbox?: [mapboxgl.Point, mapboxgl.Point],
    ) => {
      document.removeEventListener("mousemove", onMouseMoveDuringBoundingBox);
      document.removeEventListener("keydown", onKeyDownDuringBoundingBox);
      document.removeEventListener("mouseup", onMouseUpDuringBoundingBox);

      if (box) {
        box.parentNode?.removeChild(box);
        box = null;
      }

      if (bbox && map.value) {
        // Convert mapboxgl.Point to pixel bbox format for queryRenderedFeatures: [[x1, y1], [x2, y2]]
        const pixelBbox: [[number, number], [number, number]] = [
          [Math.min(bbox[0].x, bbox[1].x), Math.min(bbox[0].y, bbox[1].y)],
          [Math.max(bbox[0].x, bbox[1].x), Math.max(bbox[0].y, bbox[1].y)],
        ];

        await selectFeaturesInBoundingBox(pixelBbox);
      }

      map.value!.dragPan.enable();

      start = null;
      current = null;
    };

    canvas.addEventListener("mousedown", mouseDownForBoundingBox, true);

    (
      map.value as mapboxgl.Map & { _boundingBoxCleanup?: () => void }
    )._boundingBoxCleanup = () => {
      canvas.removeEventListener("mousedown", mouseDownForBoundingBox, true);
      document.removeEventListener("mousemove", onMouseMoveDuringBoundingBox);
      document.removeEventListener("keydown", onKeyDownDuringBoundingBox);
      document.removeEventListener("mouseup", onMouseUpDuringBoundingBox);
      if (box) {
        box.parentNode?.removeChild(box);
        box = null;
      }
      map.value!.dragPan.enable();
    };
  };

  /**
   * Removes bounding box drawing handlers
   */
  const removeBoundingBoxHandlers = () => {
    if (!map.value) return;

    // Call cleanup function if it exists
    const cleanup = (
      map.value as mapboxgl.Map & { _boundingBoxCleanup?: () => void }
    )._boundingBoxCleanup;
    if (cleanup) {
      cleanup();
      delete (map.value as mapboxgl.Map & { _boundingBoxCleanup?: () => void })
        ._boundingBoxCleanup;
    }

    map.value.dragRotate.enable();
  };

  /**
   * Selects features within the bounding box using pixel coordinates
   * Handles both individual features and clusters (expands clusters to get all leaves)
   */
  const selectFeaturesInBoundingBox = async (
    bbox: [[number, number], [number, number]],
  ) => {
    if (!map.value) return;

    // Include centroids layers as they contain the alertID property
    const alertLayers = [
      "most-recent-alerts-polygon",
      "most-recent-alerts-linestring",
      "most-recent-alerts-point",
      "most-recent-alerts-symbol",
      "most-recent-alerts-centroids",
      "previous-alerts-polygon",
      "previous-alerts-linestring",
      "previous-alerts-point",
      "previous-alerts-symbol",
      "previous-alerts-centroids",
    ];

    // Cluster layers to check separately
    const clusterLayers = [
      "most-recent-alerts-point-clusters",
      "most-recent-alerts-centroids-clusters",
      "previous-alerts-point-clusters",
      "previous-alerts-centroids-clusters",
    ];

    const mapeoLayers = [
      "mapeo-data",
      "mapeo-data-polygon",
      "mapeo-data-multipolygon",
      "mapeo-data-linestring",
    ];

    const additionalLayers = getAdditionalSelectableLayerIds();

    const allFeatures: Array<{
      properties?: {
        alertID?: string;
        id?: string;
        cluster?: boolean;
        cluster_id?: number;
      };
      layer?: { id?: string };
    }> = [];

    // First, get individual (non-clustered) features
    [...alertLayers, ...mapeoLayers, ...additionalLayers].forEach((layerId) => {
      try {
        if (map.value!.getLayer(layerId)) {
          const features = map.value!.queryRenderedFeatures(bbox, {
            layers: [layerId],
          });
          const validFeatures = features.filter(
            (f) =>
              !(f.properties as { cluster?: boolean; cluster_id?: number })
                ?.cluster &&
              (f.properties as { cluster_id?: number })?.cluster_id ===
                undefined &&
              !f.layer?.id?.includes("clusters") &&
              !f.layer?.id?.includes("cluster-count"),
          );
          allFeatures.push(...(validFeatures as typeof allFeatures));
          console.debug(
            `Layer ${layerId}: found ${validFeatures.length} individual features`,
          );
        }
      } catch (error) {
        console.warn(`Error querying layer ${layerId}:`, error);
      }
    });

    // Check for clusters in the bounding box and expand them
    for (const clusterLayerId of clusterLayers) {
      try {
        if (!map.value!.getLayer(clusterLayerId)) continue;

        // Query clusters that intersect the bounding box
        // Then get ALL leaves from those clusters (not just leaves in bbox)
        const clusterFeatures = map.value!.queryRenderedFeatures(bbox, {
          layers: [clusterLayerId],
        });

        // Determine the source name from cluster layer ID
        const sourceName = clusterLayerId.replace("-clusters", "");
        const sourceObj = map.value!.getSource(
          sourceName,
        ) as mapboxgl.GeoJSONSource | null;

        if (!sourceObj) continue;

        console.debug(
          `Found ${clusterFeatures.length} clusters in ${clusterLayerId}`,
        );

        // For each cluster, get all its leaves (individual features)
        for (const clusterFeature of clusterFeatures) {
          const clusterId = clusterFeature.properties?.cluster_id;
          if (clusterId === undefined) continue;

          try {
            // Get ALL leaves in the cluster
            const leaves: Feature[] = await new Promise((resolve, reject) => {
              sourceObj.getClusterLeaves(
                clusterId,
                Infinity, // Get ALL leaves
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

            console.debug(
              `Cluster ${clusterId} in ${sourceName} contains ${leaves.length} features`,
            );

            // Add all leaves to the selection
            leaves.forEach((leaf) => {
              // Create a feature object that matches the expected structure
              const leafFeature = {
                properties: leaf.properties,
                layer: { id: sourceName }, // Use source name as layer ID
              };
              allFeatures.push(leafFeature as (typeof allFeatures)[0]);
            });

            // Add cluster ID to set so multiple clusters can be highlighted per source
            if (!incidentClusterIds.value.has(sourceName)) {
              incidentClusterIds.value.set(sourceName, new Set());
            }
            incidentClusterIds.value.get(sourceName)!.add(clusterId);
          } catch (error) {
            console.warn(
              `Error getting cluster leaves for cluster ${clusterId}:`,
              error,
            );
          }
        }
      } catch (error) {
        console.warn(`Error querying cluster layer ${clusterLayerId}:`, error);
      }
    }

    console.debug("Total features found in bounding box:", allFeatures.length);

    // Process all features (both individual and from clusters)
    allFeatures.forEach(
      (feature: {
        properties?: { alertID?: string; id?: string; _id?: string };
        layer?: { id?: string };
      }) => {
        const featureObject = feature.properties;
        const layerId = feature.layer?.id;

        if (!layerId) return;

        let sourceId: string | null = null;
        if (featureObject?.alertID) {
          sourceId = featureObject.alertID;
        } else if (featureObject?._id) {
          // Mapeo features use _id (migrated from id)
          sourceId = featureObject._id;
        } else if (featureObject?.id) {
          // Fallback for backward compatibility
          sourceId = featureObject.id;
        }

        if (sourceId) {
          // Create a proper Feature object for handleMultiSelectFeature
          const featureForSelection: Feature = {
            type: "Feature",
            id:
              featureObject?.alertID || featureObject?._id || featureObject?.id,
            geometry: (feature as Feature).geometry || {
              type: "Point",
              coordinates: [0, 0],
            },
            properties: featureObject || {},
          };

          handleMultiSelectFeature(featureForSelection, layerId);
          console.debug(`Selected source: ${sourceId} from layer ${layerId}`);
        } else {
          console.warn(
            `No sourceId found for feature in layer ${layerId}:`,
            featureObject,
          );
        }
      },
    );

    // Update cluster highlighting after processing all features
    updateIncidentClusterHighlight();
  };

  /**
   * Adds a source to the selected sources list for incident creation
   * @param sourceTable - The table name (e.g., "fake_alerts", "mapeo_data")
   * @param sourceId - The unique identifier from the source table
   * @param notes - Optional notes about the source
   */
  const addSourceToSelection = (
    sourceTable: string,
    sourceId: string,
    notes?: string,
  ) => {
    const existingIndex = selectedSources.value.findIndex(
      (source) =>
        source.source_table === sourceTable && source.source_id === sourceId,
    );

    if (existingIndex === -1) {
      selectedSources.value.push({
        source_table: sourceTable,
        source_id: sourceId,
        notes: notes,
      });
    }
  };

  /**
   * Removes a source from the selected sources list
   * @param sourceTable - The table name of the source to remove
   * @param sourceId - The unique identifier of the source to remove
   */
  const removeSourceFromSelection = (sourceTable: string, sourceId: string) => {
    const index = selectedSources.value.findIndex(
      (source) =>
        source.source_table === sourceTable && source.source_id === sourceId,
    );

    if (index !== -1) {
      selectedSources.value.splice(index, 1);
    }
  };

  /**
   * Clears all selected sources
   */
  const clearSelectedSources = () => {
    selectedSources.value = [];
    clearSourceHighlighting();
  };

  /**
   * Handles multi-select feature selection
   * Determines source table from layer ID and route params, extracts source ID from feature properties
   *
   * Source table determination logic:
   * - For alert layers (containing "most-recent-alerts" or "previous-alerts"): Uses the table name from route params.
   *   The route structure is /alerts/{tablename}, so route.params.tablename contains the table name (e.g., "fake_alerts").
   * - For Mapeo layers (layerId === "mapeo-data"): Uses the hardcoded table name "mapeo_data".
   *
   * Source ID extraction:
   * - For alerts: Uses feature.properties.alertID
   * - For Mapeo: Uses feature.properties._id (with fallback to feature.properties.id for backward compatibility)
   *
   * @param feature - The map feature to select/deselect
   * @param layerId - The layer ID the feature belongs to (e.g., "most-recent-alerts-polygon", "mapeo-data")
   */
  const handleMultiSelectFeature = (feature: Feature, layerId: string) => {
    if (!feature.properties) return;

    let sourceTable = "";
    let sourceId = "";

    // Get table name from route params (e.g., /alerts/fake_alerts -> fake_alerts)
    const tableRaw = route.params.tablename;
    const tableName = Array.isArray(tableRaw) ? tableRaw.join("/") : tableRaw;

    if (
      layerId.includes("most-recent-alerts") ||
      layerId.includes("previous-alerts")
    ) {
      sourceTable = (tableName as string) || "";
    } else if (layerId.startsWith("mapeo-data")) {
      sourceTable = "mapeo_data";
    } else if (isAdditionalSelectableLayer(layerId)) {
      sourceTable = (tableName as string) || "";
    }

    if (feature.properties.alertID) {
      sourceId = feature.properties.alertID;
    } else if (feature.properties._id) {
      // Mapeo features use _id as primary key (migrated from id)
      // After migration 0002_standardize_mapeo_data_primary_key.sql, the mapeo_data table
      // uses _id as its primary key instead of id. However, we maintain backward compatibility
      // by checking for id as a fallback because migrations have not yet been run on all partner
      // VMs. Once all environments have been migrated and we can guarantee no data uses the old
      // id column, we can remove the fallback check.
      sourceId = feature.properties._id;
    } else if (feature.properties.id) {
      // TODO: Remove this fallback once migration 0002_standardize_mapeo_data_primary_key.sql
      // has been run on all partner VMs and we can guarantee no data uses the old id column.
      // This fallback exists for backward compatibility during the migration period.
      sourceId = feature.properties.id;
    }

    if (sourceTable && sourceId) {
      const isAlreadySelected = selectedSources.value.some(
        (source) =>
          source.source_table === sourceTable && source.source_id === sourceId,
      );

      // Don't toggle-off on click/box. Deselect is explicit via controls.
      if (!isAlreadySelected) {
        addSourceToSelection(sourceTable, sourceId);
        highlightSelectedSource(feature, layerId);
      }
    }
  };

  /**
   * Highlights a selected source on the map using feature state
   * Checks for duplicates before adding to prevent multiple highlights on the same feature
   * @param feature - The map feature to highlight
   * @param layerId - The layer ID the feature belongs to
   */
  const highlightSelectedSource = (feature: Feature, layerId: string) => {
    if (!map.value) return;

    const featureStateTarget = resolveFeatureStateTarget(feature, layerId);
    if (!featureStateTarget) return;

    const { featureId, sourceId, sourceLayer } = featureStateTarget;

    // Check if this feature is already highlighted
    const existingIndex = highlightedSources.value.findIndex(
      (highlighted) =>
        highlighted.featureId === featureId && highlighted.layerId === layerId,
    );

    if (existingIndex === -1) {
      highlightedSources.value.push({
        featureId,
        layerId,
        sourceId,
        sourceLayer,
      });

      const target = sourceLayer
        ? { source: sourceId, sourceLayer, id: featureId }
        : { source: sourceId, id: featureId };
      map.value.setFeatureState(target, { selected: true });
    }
  };

  /**
   * Unhighlights a specific selected source on the map
   * @param feature - The map feature to unhighlight
   * @param layerId - The layer ID the feature belongs to
   */
  const unhighlightSelectedSource = (feature: Feature, layerId: string) => {
    if (!map.value) return;

    const featureStateTarget = resolveFeatureStateTarget(feature, layerId);
    if (!featureStateTarget) return;

    const { featureId } = featureStateTarget;
    // Remove from highlighted sources array
    const existingIndex = highlightedSources.value.findIndex(
      (highlighted) =>
        highlighted.featureId === featureId && highlighted.layerId === layerId,
    );

    if (existingIndex !== -1) {
      const [existingHighlight] = highlightedSources.value.splice(
        existingIndex,
        1,
      );

      try {
        const target = existingHighlight.sourceLayer
          ? {
              source: existingHighlight.sourceId,
              sourceLayer: existingHighlight.sourceLayer,
              id: existingHighlight.featureId,
            }
          : {
              source: existingHighlight.sourceId,
              id: existingHighlight.featureId,
            };
        map.value!.setFeatureState(target, { selected: false });
      } catch (error) {
        // Ignore errors if layer/source doesn't exist
        console.warn("Error unhighlighting feature state:", error);
      }
    }
  };

  /**
   * Updates cluster layer styling to highlight clusters containing selected features.
   * Uses the same pattern as useFeatureSelection.ts updateClusterHighlight()
   */
  const updateIncidentClusterHighlight = () => {
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
        const clusterIdSet = incidentClusterIds.value.get(source);

        // If no clusters selected for this source, reset to default color
        if (!clusterIdSet || clusterIdSet.size === 0) {
          map.value!.setPaintProperty(clustersLayer, "circle-color", color);
        } else {
          // Highlight any cluster whose ID is in the set (persists across zoom)
          const idsArray = Array.from(clusterIdSet);
          const paintExpression: mapboxgl.ExpressionSpecification = [
            "case",
            ["in", ["get", "cluster_id"], ["literal", idsArray]],
            "#FFFF00", // Yellow if this cluster contains selected features
            color, // Default color otherwise
          ];
          map.value!.setPaintProperty(
            clustersLayer,
            "circle-color",
            paintExpression,
          );
        }
      }
    });
  };

  /**
   * Clears all source highlighting from the map
   */
  const clearSourceHighlighting = () => {
    if (!map.value) return;

    highlightedSources.value.forEach(({ featureId, sourceId, sourceLayer }) => {
      try {
        const target = sourceLayer
          ? { source: sourceId, sourceLayer, id: featureId }
          : { source: sourceId, id: featureId };
        map.value!.setFeatureState(target, { selected: false });
      } catch (error) {
        // Ignore errors if layer/source doesn't exist
        console.warn("Error clearing feature state:", error);
      }
    });
    highlightedSources.value = [];

    // Clear cluster highlighting
    incidentClusterIds.value.clear();
    updateIncidentClusterHighlight();
  };

  /**
   * Highlights a cluster containing the specified alertID.
   * This is used when incident entries are part of clusters.
   *
   * Note: This only works when clusters are visible (zoomed out, zoom < clusterMaxZoom).
   * When zoomed in, clusters break down into individual features and aren't rendered,
   * so we can't find them. However, if we previously found a cluster ID, it will be
   * preserved in incidentClusterIds so it shows when zooming back out.
   *
   * When zooming out, clusters merge and get new IDs, so this function is called again
   * to find the new merged cluster that contains the alertID.
   */
  const highlightClusterForAlertId = async (
    alertId: string,
    sourceName: string,
  ) => {
    if (!map.value) return;

    const clusterLayerName = `${sourceName}-clusters`;
    if (!map.value.getLayer(clusterLayerName)) return;

    const sourceObj = map.value.getSource(
      sourceName,
    ) as mapboxgl.GeoJSONSource | null;
    if (!sourceObj) return;

    // Get all visible cluster features (query entire viewport)
    // Note: queryRenderedFeatures only finds clusters that are currently rendered.
    // When zoomed in (zoom >= clusterMaxZoom), clusters break down and aren't rendered,
    // so this will return an empty array. That's okay - we'll preserve any previously
    // found cluster IDs so they show when zooming back out.
    // When zooming out, clusters merge and get new IDs, so we need to re-find them.
    const clusterFeatures = (
      map.value.queryRenderedFeatures as (
        geometry?:
          | mapboxgl.PointLike
          | [mapboxgl.PointLike, mapboxgl.PointLike],
        options?: { layers?: string[]; filter?: mapboxgl.FilterSpecification },
      ) => mapboxgl.MapboxGeoJSONFeature[]
    )(undefined, {
      layers: [clusterLayerName],
    });

    // Find which cluster contains this alertID
    // Check ALL visible clusters (don't break early) to handle cases where clusters merge
    let foundCluster = false;
    for (const clusterFeature of clusterFeatures) {
      const clusterId = clusterFeature.properties?.cluster_id;
      if (clusterId === undefined) continue;

      try {
        // Get the leaves (individual points) of this cluster
        const leaves: Feature[] = await new Promise((resolve, reject) => {
          sourceObj.getClusterLeaves(
            clusterId,
            Infinity,
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

        // Check if any leaf matches our alertID
        const containsAlert = leaves.some(
          (leaf) => leaf.properties?.alertID === alertId,
        );

        if (containsAlert) {
          // Add cluster ID to set so multiple clusters stay highlighted across zoom
          if (!incidentClusterIds.value.has(sourceName)) {
            incidentClusterIds.value.set(sourceName, new Set());
          }
          incidentClusterIds.value.get(sourceName)!.add(clusterId);
          foundCluster = true;
          // Don't break - same alert can appear in cluster leaves if duplicated
        }
      } catch {
        continue;
      }
    }

    // Update highlighting after checking all clusters
    if (foundCluster) {
      updateIncidentClusterHighlight();
    }
    // If no cluster found (e.g., zoomed in where clusters aren't rendered),
    // we don't clear incidentClusterIds - this preserves the cluster ID so it
    // shows when zooming back out (similar to useFeatureSelection behavior)
  };

  /**
   * Handles incident cluster highlighting when zoom changes.
   * This should be called from the zoom listener in AlertsDashboard.vue.
   * Re-finds merged clusters when zooming out (clusters merge and get new IDs).
   *
   * Works for both:
   * 1. Selected incidents (viewing incident details)
   * 2. Highlighted sources from bounding box/multi-select
   */
  const handleIncidentClusterZoom = async () => {
    if (!map.value) return;

    // Check if we have clusters to re-highlight
    const hasClusterIds = incidentClusterIds.value.size > 0;
    const hasSelectedIncident =
      selectedIncident.value && selectedIncidentEntries.value.length > 0;
    const hasHighlightedSources = highlightedSources.value.length > 0;
    // If we have a selected incident, use that (for viewing incident details)
    if (hasSelectedIncident) {
      // Clear old cluster IDs before re-finding (clusters may have merged with new IDs)
      incidentClusterIds.value.clear();
      // Small delay to ensure clusters have rendered after zoom
      setTimeout(() => {
        highlightIncidentEntries(selectedIncidentEntries.value);
      }, 100);
      return;
    }

    // If we have highlighted sources (from bounding box/multi-select), re-find clusters so selection persists across zoom
    if (hasHighlightedSources) {
      // Clear old cluster IDs - they're invalid after zoom (clusters merge and get new IDs)
      incidentClusterIds.value.clear();

      // Group highlighted sources by cluster source layer (point/centroids)
      const sourcesByLayer = new Map<string, string[]>(); // sourceName -> alertIDs

      highlightedSources.value.forEach(({ featureId, layerId }) => {
        let clusterSourceName: string | null = null;

        if (layerId.includes("-point")) {
          clusterSourceName = layerId;
        } else if (layerId.includes("-centroids")) {
          clusterSourceName = layerId;
        } else if (
          layerId.includes("-polygon") ||
          layerId.includes("-linestring")
        ) {
          const prefix = layerId.replace(
            /-polygon|-linestring|-multipolygon/i,
            "",
          );
          clusterSourceName = `${prefix}-centroids`;
        }

        if (clusterSourceName) {
          if (!sourcesByLayer.has(clusterSourceName)) {
            sourcesByLayer.set(clusterSourceName, []);
          }
          const alertId =
            typeof featureId === "string" ? featureId : String(featureId);
          sourcesByLayer.get(clusterSourceName)!.push(alertId);
        }
      });

      // Re-find clusters for each source: every cluster that contains any selected point must stay highlighted
      const rehighlightPromises: Promise<void>[] = [];
      sourcesByLayer.forEach((alertIds, sourceName) => {
        for (const alertId of alertIds) {
          rehighlightPromises.push(
            highlightClusterForAlertId(alertId, sourceName),
          );
        }
      });

      // Small delay to ensure clusters have rendered after zoom
      setTimeout(async () => {
        await Promise.all(rehighlightPromises);
        updateIncidentClusterHighlight();
      }, 100);
      return;
    }

    // If no sources to highlight, clear cluster highlighting
    if (!hasClusterIds && !hasHighlightedSources) {
      incidentClusterIds.value.clear();
      updateIncidentClusterHighlight();
    }
  };

  /**
   * Highlights all entries of a saved incident on the map.
   * Uses querySourceFeatures so it works even if features are off-screen.
   * Also handles cluster highlighting when features are clustered.
   */
  const highlightIncidentEntries = async (entries: CollectionEntry[]) => {
    if (!map.value) return;
    if (!entries || entries.length === 0) return;

    const tableRaw = route.params.tablename;
    const currentAlertsTable = Array.isArray(tableRaw)
      ? tableRaw.join("/")
      : (tableRaw as string | undefined);

    const alertLayers = [
      "most-recent-alerts-polygon",
      "most-recent-alerts-linestring",
      "most-recent-alerts-point",
      "most-recent-alerts-centroids",
      "previous-alerts-polygon",
      "previous-alerts-linestring",
      "previous-alerts-point",
      "previous-alerts-centroids",
    ];

    const foundFeatures: Feature[] = [];

    // Process entries and highlight features
    for (const entry of entries) {
      // If the entry refers to a different alerts table than the current route,
      // the map won't have that data loaded; still try best-effort highlighting.
      if (
        entry.source_table !== "mapeo_data" &&
        currentAlertsTable &&
        entry.source_table !== currentAlertsTable
      ) {
        console.warn(
          "Incident entry source_table does not match current route:",
          entry.source_table,
          currentAlertsTable,
        );
      }

      const candidateSources =
        entry.source_table === "mapeo_data"
          ? [
              "mapeo-data",
              "mapeo-data-polygon",
              "mapeo-data-multipolygon",
              "mapeo-data-linestring",
              "mapeo-data-multilinestring",
            ]
          : alertLayers;

      const filter: mapboxgl.ExpressionSpecification =
        entry.source_table === "mapeo_data"
          ? [
              "any",
              ["==", ["get", "_id"], entry.source_id],
              ["==", ["get", "id"], entry.source_id],
            ]
          : ["==", ["get", "alertID"], entry.source_id];

      let found = false;

      for (const sourceId of candidateSources) {
        try {
          if (!map.value!.getSource(sourceId)) continue;

          const matches = map.value!.querySourceFeatures(sourceId, {
            filter,
          });

          if (matches.length > 0) {
            const feature = matches[0] as unknown as Feature;

            // Check if this is a cluster feature
            const isCluster =
              feature.properties?.cluster === true ||
              feature.properties?.cluster_id !== undefined;

            if (isCluster) {
              // If it's a cluster, highlight the cluster
              // For alert entries, we need to find which cluster contains this alertID
              if (entry.source_table !== "mapeo_data" && entry.source_id) {
                // Determine the centroids source for cluster checking
                const centroidsSource = sourceId.includes("most-recent")
                  ? "most-recent-alerts-centroids"
                  : sourceId.includes("previous")
                    ? "previous-alerts-centroids"
                    : sourceId.includes("point")
                      ? sourceId
                      : null;

                if (centroidsSource) {
                  await highlightClusterForAlertId(
                    entry.source_id,
                    centroidsSource,
                  );
                }
              }
            } else {
              // Regular feature - highlight it normally
              highlightSelectedSource(feature, sourceId);

              // Also check if this feature is part of a cluster at current zoom
              // (it might be de-clustered when zoomed in, but we still want to highlight the cluster if zoomed out)
              if (entry.source_table !== "mapeo_data" && entry.source_id) {
                const centroidsSource = sourceId.includes("most-recent")
                  ? "most-recent-alerts-centroids"
                  : sourceId.includes("previous")
                    ? "previous-alerts-centroids"
                    : sourceId.includes("point")
                      ? sourceId
                      : null;

                if (centroidsSource) {
                  await highlightClusterForAlertId(
                    entry.source_id,
                    centroidsSource,
                  );
                }
              }
            }

            foundFeatures.push(feature);
            found = true;
            break;
          }
        } catch (error) {
          // Ignore errors for missing sources
          console.warn("Error highlighting incident entry:", error);
        }
      }

      // If we didn't find the feature in any source, it might be clustered
      // Try checking clusters directly
      if (!found && entry.source_table !== "mapeo_data" && entry.source_id) {
        const centroidsSources = [
          "most-recent-alerts-centroids",
          "previous-alerts-centroids",
        ];

        for (const centroidsSource of centroidsSources) {
          if (map.value!.getSource(centroidsSource)) {
            await highlightClusterForAlertId(entry.source_id, centroidsSource);
          }
        }
      }
    }

    // Note: Zoom listener is set up in AlertsDashboard.vue to call handleIncidentClusterZoom
  };

  // Cleanup on unmount
  onBeforeUnmount(() => {
    if (incidentPrefetchTimeout) {
      clearTimeout(incidentPrefetchTimeout);
      incidentPrefetchTimeout = null;
    }
  });

  return {
    // State
    incidents,
    incidentsTotal,
    incidentsLimit,
    isLoadingMoreIncidents,
    showIncidentsSidebar,
    openSidebarWithCreateForm,
    selectedSources,
    isCreatingIncident,
    multiSelectMode,
    boundingBoxMode,
    isLoadingIncidents,
    selectedIncident,
    selectedIncidentData,
    selectedIncidentEntries,
    isLoadingSelectedIncident,
    hoveredButton,
    hasMoreIncidents,
    // Functions
    fetchIncidents,
    loadMoreIncidents,
    clearSelectedIncident,
    scheduleIncidentPrefetch,
    openIncidentDetails,
    createIncident,
    toggleIncidentsSidebar,
    openIncidentsSidebarWithCreateForm,
    toggleMultiSelectMode,
    toggleBoundingBoxMode,
    removeBoundingBoxHandlers,
    addSourceToSelection,
    removeSourceFromSelection,
    clearSelectedSources,
    handleMultiSelectFeature,
    highlightSelectedSource,
    unhighlightSelectedSource,
    clearSourceHighlighting,
    highlightIncidentEntries,
    handleIncidentClusterZoom,
  };
};
