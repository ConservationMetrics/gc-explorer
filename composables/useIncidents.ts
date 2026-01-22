import { computed, onBeforeUnmount, ref } from "vue";
import type { RouteLocationNormalizedLoaded } from "vue-router";
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
 * @param apiKey - API key for authenticating requests to the incidents API
 * @returns Object containing all incidents state and functions
 */
export const useIncidents = (
  map: Ref<mapboxgl.Map | undefined>,
  route: RouteLocationNormalizedLoaded,
  apiKey: string,
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
    "incidents" | "boundingBox" | "multiSelect" | "createIncident" | null
  >(null);

  // Highlighted sources tracking
  const highlightedSources = ref<
    Array<{ featureId: string | number; layerId: string }>
  >([]);

  // Incident details cache
  const incidentDetailsCache = new Map<string, IncidentDetailsResponse>();
  const incidentDetailsInFlight = new Map<
    string,
    Promise<IncidentDetailsResponse>
  >();

  let incidentPrefetchTimeout: ReturnType<typeof setTimeout> | null = null;

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
   * Also removes incidentId from URL query params when going back to incidents list
   */
  const clearSelectedIncident = () => {
    selectedIncident.value = null;
    selectedIncidentData.value = null;
    selectedIncidentEntries.value = [];
    clearSourceHighlighting();

    // Remove incidentId from URL when going back to incidents list
    const query = { ...route.query };
    delete query.incidentId;
    router.replace({ query });
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
      console.log("Enabling bounding box mode");
      if (map.value) {
        console.log("Disabling drag rotate");
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
   * Sets up custom bounding box selection (Ctrl/Cmd + drag)
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
      if (!((e.ctrlKey || e.metaKey) && e.button === 0)) return;

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
    const finishBoundingBox = (bbox?: [mapboxgl.Point, mapboxgl.Point]) => {
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

        selectFeaturesInBoundingBox(pixelBbox);
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
   * Uses the same robust layer checking as multi-select
   */
  const selectFeaturesInBoundingBox = (
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

    const mapeoLayers = ["mapeo-data"];

    const allFeatures: Array<{
      properties?: {
        alertID?: string;
        id?: string;
        cluster?: boolean;
        cluster_id?: number;
      };
      layer?: { id?: string };
    }> = [];

    alertLayers.forEach((layerId) => {
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
            `Layer ${layerId}: found ${validFeatures.length} features`,
          );
        }
      } catch (error) {
        console.warn(`Error querying layer ${layerId}:`, error);
      }
    });

    mapeoLayers.forEach((layerId) => {
      try {
        if (map.value!.getLayer(layerId)) {
          const features = map.value!.queryRenderedFeatures(bbox, {
            layers: [layerId],
          });
          allFeatures.push(...(features as typeof allFeatures));
          console.debug(`Layer ${layerId}: found ${features.length} features`);
        }
      } catch (error) {
        console.warn(`Error querying layer ${layerId}:`, error);
      }
    });

    console.debug("Total features found in bounding box:", allFeatures.length);

    allFeatures.forEach(
      (feature: {
        properties?: { alertID?: string; id?: string };
        layer?: { id?: string };
      }) => {
        const featureObject = feature.properties;
        const layerId = feature.layer?.id;

        if (!layerId) return;

        let sourceId: string | null = null;
        if (featureObject?.alertID) {
          sourceId = featureObject.alertID;
        } else if (featureObject?.id) {
          sourceId = featureObject.id;
        }

        if (sourceId) {
          handleMultiSelectFeature(feature as Feature, layerId);
          console.debug(`Selected source: ${sourceId} from layer ${layerId}`);
        } else {
          console.warn(
            `No sourceId found for feature in layer ${layerId}:`,
            featureObject,
          );
        }
      },
    );
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
   * Handles multi-select feature selection with toggle behavior
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
   * Toggle behavior: If the feature is already selected, it will be deselected. Otherwise, it will be selected.
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
    } else if (layerId === "mapeo-data") {
      sourceTable = "mapeo_data";
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
      // Check if already selected
      const isAlreadySelected = selectedSources.value.some(
        (source) =>
          source.source_table === sourceTable && source.source_id === sourceId,
      );

      if (isAlreadySelected) {
        // Deselect: remove from selection and unhighlight
        removeSourceFromSelection(sourceTable, sourceId);
        unhighlightSelectedSource(feature, layerId);
      } else {
        // Select: add to selection and highlight
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

    const featureId = layerId.includes("-centroids")
      ? feature.properties?.alertID
      : feature.id;

    if (featureId !== undefined && featureId !== null) {
      // Check if this feature is already highlighted
      const existingIndex = highlightedSources.value.findIndex(
        (highlighted) =>
          highlighted.featureId === featureId &&
          highlighted.layerId === layerId,
      );

      if (existingIndex === -1) {
        highlightedSources.value.push({
          featureId,
          layerId,
        });

        map.value.setFeatureState(
          { source: layerId, id: featureId },
          { selected: true },
        );
      }
    }
  };

  /**
   * Unhighlights a specific selected source on the map
   * @param feature - The map feature to unhighlight
   * @param layerId - The layer ID the feature belongs to
   */
  const unhighlightSelectedSource = (feature: Feature, layerId: string) => {
    if (!map.value) return;

    const featureId = layerId.includes("-centroids")
      ? feature.properties?.alertID
      : feature.id;

    if (featureId !== undefined && featureId !== null) {
      // Remove from highlighted sources array
      const existingIndex = highlightedSources.value.findIndex(
        (highlighted) =>
          highlighted.featureId === featureId &&
          highlighted.layerId === layerId,
      );

      if (existingIndex !== -1) {
        highlightedSources.value.splice(existingIndex, 1);

        try {
          map.value!.setFeatureState(
            { source: layerId, id: featureId },
            { selected: false },
          );
        } catch (error) {
          // Ignore errors if layer/source doesn't exist
          console.warn("Error unhighlighting feature state:", error);
        }
      }
    }
  };

  /**
   * Clears all source highlighting from the map
   */
  const clearSourceHighlighting = () => {
    if (!map.value) return;

    highlightedSources.value.forEach(({ featureId, layerId }) => {
      try {
        map.value!.setFeatureState(
          { source: layerId, id: featureId },
          { selected: false },
        );
      } catch (error) {
        // Ignore errors if layer/source doesn't exist
        console.warn("Error clearing feature state:", error);
      }
    });
    highlightedSources.value = [];
  };

  /**
   * Highlights all entries of a saved incident on the map.
   * Uses querySourceFeatures so it works even if features are off-screen.
   */
  const highlightIncidentEntries = (entries: CollectionEntry[]) => {
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

    entries.forEach((entry) => {
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
        entry.source_table === "mapeo_data" ? ["mapeo-data"] : alertLayers;

      const filter: mapboxgl.ExpressionSpecification =
        entry.source_table === "mapeo_data"
          ? ["==", ["get", "id"], entry.source_id]
          : ["==", ["get", "alertID"], entry.source_id];

      for (const sourceId of candidateSources) {
        try {
          if (!map.value!.getSource(sourceId)) continue;

          const matches = map.value!.querySourceFeatures(sourceId, {
            filter,
          });

          if (matches.length > 0) {
            const feature = matches[0] as unknown as Feature;
            highlightSelectedSource(feature, sourceId);
            foundFeatures.push(feature);
            break;
          }
        } catch (error) {
          // Ignore errors for missing sources
          console.warn("Error highlighting incident entry:", error);
        }
      }
    });
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
  };
};
