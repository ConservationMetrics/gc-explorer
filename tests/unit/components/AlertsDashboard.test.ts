import { secondaryGeometry } from "@/tests/fixtures/secondaryGeometry";
import { describe, it, expect, beforeEach, onTestFinished, vi } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";
import {
  ref,
  reactive,
  computed,
  watch,
  onMounted,
  onBeforeUnmount,
  nextTick,
  type Plugin,
} from "vue";
import { createI18n } from "vue-i18n";
import type { FeatureCollection } from "geojson";

import * as mapboxMock from "@/tests/unit/helpers/mapboxMock";

import AlertsDashboard from "@/components/AlertsDashboard.vue";
import { INCIDENT_FIT_BOUNDS_OPTIONS } from "@/utils/incidentHelpers";

// Create i18n instance for template $t support (locales mirror app i18n config)
const i18n = createI18n({
  legacy: false,
  locale: "en",
  messages: {
    en: {},
    es: {},
    pt: {},
    nl: {},
  },
});

// Re-usable minimal props object
const baseProps: InstanceType<typeof AlertsDashboard>["$props"] = {
  alertsData: {
    mostRecentAlerts: { type: "FeatureCollection" as const, features: [] },
    previousAlerts: { type: "FeatureCollection" as const, features: [] },
  },
  alertsStatistics: {
    territory: "",
    typeOfAlerts: [],
    dataProviders: [],
    alertDetectionRange: "",
    allDates: [],
    earliestAlertsDate: "",
    recentAlertsDate: "",
    recentAlertsNumber: 0,
    alertsTotal: 0,
    alertsPerMonth: {},
    hectaresTotal: null,
    hectaresPerMonth: null,
    twelveMonthsBefore: "",
  },
  allowedFileExtensions: {
    audio: [],
    image: ["jpg"],
    video: [],
  },
  logoUrl: "",
  mapLegendLayerIds: "",
  mapboxAccessToken: "pk.test",
  mapboxBearing: 0,
  mapboxLatitude: 0,
  mapboxLongitude: 0,
  mapboxPitch: 0,
  mapboxProjection: "mercator",
  mapboxStyle: "mapbox://styles/mapbox/streets-v12",
  mapboxZoom: 2,
  mapbox3d: false,
  mapbox3dTerrainExaggeration: 1.5,
  secondaryData: null,
  primaryDataset: "test_alerts",
  secondaryDataset: "mapeo_data",
  mediaBasePath: "",
  mediaBasePathAlerts: "",
  planetApiKey: "",
};

const hoverGeometry: FeatureCollection = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      id: 1,
      properties: { _id: "point", "filter-color": "#3333FF" },
      geometry: { type: "Point", coordinates: [0, 0] },
    },
    {
      type: "Feature",
      id: 2,
      properties: { _id: "polygon" },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [0, 0],
            [1, 1],
            [1, 0],
            [0, 0],
          ],
        ],
      },
    },
    {
      type: "Feature",
      id: 3,
      properties: { _id: "line" },
      geometry: {
        type: "LineString",
        coordinates: [
          [0, 0],
          [1, 1],
        ],
      },
    },
  ],
};

// Mock Nuxt composables - needs to be before component import
const hoisted = vi.hoisted(() => ({
  mockFetch: vi.fn(),
}));

const mockUseToast = () => ({
  error: vi.fn(),
  warning: vi.fn(),
  success: vi.fn(),
  info: vi.fn(),
});

// Make Vue reactivity functions and Nuxt composables available globally (for auto-imports)
Object.assign(globalThis, {
  ref,
  reactive,
  computed,
  watch,
  onMounted,
  onBeforeUnmount,
  nextTick,
  useToast: mockUseToast,
  useRuntimeConfig: () => ({ public: { appApiKey: "test-key" } }),
  $fetch: hoisted.mockFetch,
});

// Mock vue-router for route & router injections
const mockRoute = ref({ params: {}, query: {} });
const mockRouter = { replace: vi.fn(), push: vi.fn() };
vi.mock("vue-router", () => ({
  useRoute: () => mockRoute.value,
  useRouter: () => mockRouter,
}));
// useRecordCache reads the route via the Nuxt auto-imported useRoute global.
Object.assign(globalThis, { useRoute: () => mockRoute.value });

vi.mock("#imports", async () => {
  const mod = await import("../helpers/importsMock");
  return {
    ...mod,
    $fetch: hoisted.mockFetch,
  };
});

const canAccessIncidents = ref(true);
vi.mock("@/composables/auth/useHasRole", () => ({
  useHasRole: () => canAccessIncidents,
}));

describe("AlertsDashboard component", () => {
  beforeEach(() => {
    mapboxMock.reset();
    mockRoute.value = { params: {}, query: {} };
    document.body.innerHTML = '<div id="map"></div>';
    canAccessIncidents.value = true;
    mockRoute.value = { params: {}, query: {} };
    hoisted.mockFetch.mockReset();
    // Mock $fetch to return empty incidents by default
    hoisted.mockFetch.mockResolvedValue({
      incidents: [],
      total: 0,
      limit: 10,
      offset: 0,
    });
  });

  // Helper to mount with i18n mocks
  const mountComponent = (
    props = baseProps,
    options: {
      plugins?: Plugin[];
      stubs?: Record<string, unknown>;
      mocks?: Record<string, unknown>;
    } = {},
  ) => {
    return mount(AlertsDashboard, {
      props,
      global: {
        plugins: [i18n, ...(options.plugins || [])],
        stubs: {
          ViewSidebar: true,
          MapLegend: true,
          BasemapSelector: true,
          ...options.stubs,
        },
        mocks: {
          $t: (key: string) => key,
          ...options.mocks,
        },
      },
    });
  };

  it("normal secondary polygon selection and reset target the shared source", async () => {
    Object.assign(mockRoute.value, {
      path: "/alerts/test_alerts",
      params: { tablename: "test_alerts" },
    });
    hoisted.mockFetch.mockResolvedValue({
      _id: "multipolygon",
      name: "Mapping areas",
    });
    const wrapper = mountComponent({
      ...baseProps,
      secondaryData: secondaryGeometry,
    });
    mapboxMock.fireLoad();
    await flushPromises();
    mapboxMock.mockMap.getSource.mockReturnValue(true);
    mapboxMock.fireClick("secondary-data-polygon", {
      features: [secondaryGeometry.features[4]],
    });
    await flushPromises();
    expect(mapboxMock.setFeatureState).toHaveBeenCalledWith(
      { source: "secondary-data", id: 5 },
      { selected: true },
    );
    expect(mockRouter.replace).toHaveBeenCalledWith({
      query: { secondaryDocId: "multipolygon" },
    });
    mockRoute.value.query = { secondaryDocId: "multipolygon" };
    const vm = wrapper.vm as unknown as { resetSelectedFeature: () => void };
    vm.resetSelectedFeature();
    expect(mapboxMock.setFeatureState).toHaveBeenCalledWith(
      { source: "secondary-data", id: 5 },
      { selected: false },
    );
    expect(mockRouter.replace).toHaveBeenLastCalledWith({ query: {} });
    wrapper.unmount();
  });

  it.each([
    secondaryGeometry,
    {
      ...secondaryGeometry,
      features: secondaryGeometry.features.filter((feature) =>
        feature.geometry.type.startsWith("Multi"),
      ),
    },
  ])(
    "renders mixed and multipart secondary geometry and selects incidents once per record",
    async (secondaryData) => {
      const wrapper = mountComponent({ ...baseProps, secondaryData });
      mapboxMock.fireLoad();
      await flushPromises();
      expect(
        mapboxMock.layers
          .filter((layer) => layer.source === "secondary-data")
          .map((layer) => layer.type),
      ).toEqual(["circle", "line", "fill", "line"]);
      const vm = wrapper.vm as unknown as {
        multiSelectMode: boolean;
        selectedSources: Array<{ source_table: string; source_id: string }>;
        openIncidentDetails: (id: string) => Promise<void>;
        handleMultiSelectFeature: (feature: unknown, layer: string) => void;
      };
      vm.multiSelectMode = true;
      mapboxMock.mockMap.getLayer.mockImplementation(
        (id?: string) => ({ id, source: "secondary-data" }) as never,
      );
      mapboxMock.mockMap.getSource.mockReturnValue(true);
      for (const feature of secondaryData.features) {
        const layer = feature.geometry.type.includes("Line")
          ? "secondary-data-line"
          : feature.geometry.type.includes("Polygon")
            ? "secondary-data-polygon"
            : "secondary-data";
        mapboxMock.fireClick(layer, { features: [feature] });
        mapboxMock.fireClick(layer, { features: [feature] });
        expect(mapboxMock.setFeatureState).toHaveBeenCalledWith(
          { source: "secondary-data", id: feature.id },
          { incidentSelected: true },
        );
      }
      expect(vm.selectedSources).toHaveLength(secondaryData.features.length);
      expect(
        vm.selectedSources.every(
          (source) => source.source_table === "mapeo_data",
        ),
      ).toBe(true);
      wrapper.unmount();
      mapboxMock.mockMap.getLayer.mockReturnValue(false);
    },
  );

  it("box-selects secondary lines and polygons once and restores saved incident highlights", async () => {
    const canvas = document.createElement("div");
    mapboxMock.mockMap.getCanvasContainer.mockReturnValue(canvas);
    const wrapper = mountComponent({
      ...baseProps,
      secondaryData: secondaryGeometry,
    });
    mapboxMock.fireLoad();
    await flushPromises();
    mapboxMock.mockMap.getLayer.mockImplementation(
      (id?: string) => ({ id, source: "secondary-data" }) as never,
    );
    mapboxMock.mockMap.getSource.mockReturnValue(true);
    const features = secondaryGeometry.features.filter(
      (feature) => feature.geometry.type !== "Point",
    );
    mapboxMock.mockMap.queryRenderedFeatures.mockImplementation(
      (_box: unknown, options?: { layers: string[] }) => {
        const id = options?.layers[0];
        return features
          .filter(
            (feature) =>
              id ===
              (feature.geometry.type.includes("Line")
                ? "secondary-data-line"
                : "secondary-data-polygon"),
          )
          .flatMap((feature) => [
            { ...feature, layer: { id } },
            { ...feature, layer: { id } },
          ]) as never;
      },
    );
    const vm = wrapper.vm as unknown as {
      toggleBoundingBoxMode: () => void;
      selectedSources: unknown[];
      openIncidentDetails: (id: string) => Promise<void>;
    };
    vm.toggleBoundingBoxMode();
    await flushPromises();
    canvas.dispatchEvent(
      new MouseEvent("mousedown", {
        button: 0,
        ctrlKey: true,
        clientX: 0,
        clientY: 0,
      }),
    );
    document.dispatchEvent(
      new MouseEvent("mouseup", { clientX: 100, clientY: 100 }),
    );
    await flushPromises();
    expect(vm.selectedSources).toHaveLength(4);
    mapboxMock.mockMap.querySourceFeatures.mockImplementation(
      (_id: unknown, options?: { filter: unknown[] }) => {
        const text = JSON.stringify(options?.filter);
        return features.filter((feature) =>
          text.includes(`"${feature.properties?._id}"`),
        ) as never;
      },
    );
    mapboxMock.setFeatureState.mockClear();
    hoisted.mockFetch.mockResolvedValueOnce({
      incident: { id: "saved-secondary" },
      entries: features.map((feature) => ({
        source_table: "mapeo_data",
        source_id: feature.properties?._id,
        feature_type: "secondary",
        source_data: {
          g__type: feature.geometry.type,
          g__coordinates: JSON.stringify(
            "coordinates" in feature.geometry
              ? feature.geometry.coordinates
              : [],
          ),
        },
      })),
    });
    await vm.openIncidentDetails("saved-secondary");
    for (const feature of features)
      expect(mapboxMock.setFeatureState).toHaveBeenCalledWith(
        { source: "secondary-data", id: feature.id },
        { incidentSelected: true },
      );
    wrapper.unmount();
    mapboxMock.mockMap.getLayer.mockReturnValue(false);
    mapboxMock.mockMap.queryRenderedFeatures.mockReturnValue([]);
    mapboxMock.mockMap.querySourceFeatures.mockReturnValue([]);
  });

  it.each([
    ["most-recent-alerts-polygon", "secondary-data"],
    ["secondary-data", "most-recent-alerts-polygon"],
    ["most-recent-alerts-point", "most-recent-alerts-polygon"],
  ])(
    "keeps the pointer over %s after leaving overlapping %s",
    async (remaining, leaving) => {
      const canvas = document.createElement("canvas");
      const getCanvas = mapboxMock.mockMap.getCanvas.getMockImplementation()!;
      mapboxMock.mockMap.getCanvas.mockReturnValue(canvas);
      onTestFinished(() =>
        mapboxMock.mockMap.getCanvas.mockImplementation(getCanvas),
      );
      const wrapper = mountComponent({
        ...baseProps,
        secondaryData: {
          ...hoverGeometry,
          features: [hoverGeometry.features[0]],
        },
        alertsData: {
          ...baseProps.alertsData,
          mostRecentAlerts: {
            type: "FeatureCollection",
            features: [hoverGeometry.features[0], hoverGeometry.features[1]],
          },
        },
      });
      onTestFinished(() => wrapper.unmount());
      mapboxMock.fireLoad();
      await flushPromises();
      mapboxMock.fireHover([remaining]);
      expect(canvas.style.cursor).toBe("pointer");
      mapboxMock.fireHover([remaining, leaving]);
      mapboxMock.fireHover([remaining]);
      expect(canvas.style.cursor).toBe("pointer");
      mapboxMock.fireHover([]);
      expect(canvas.style.cursor).toBe("");
    },
  );

  it("does not reattach hover listeners when changing basemaps while hovered", async () => {
    const canvas = document.createElement("canvas");
    const getCanvas = mapboxMock.mockMap.getCanvas.getMockImplementation()!;
    mapboxMock.mockMap.getCanvas.mockReturnValue(canvas);
    onTestFinished(() =>
      mapboxMock.mockMap.getCanvas.mockImplementation(getCanvas),
    );
    const wrapper = mountComponent({
      ...baseProps,
      secondaryData: {
        ...hoverGeometry,
        features: [hoverGeometry.features[0]],
      },
      alertsData: {
        ...baseProps.alertsData,
        mostRecentAlerts: {
          ...hoverGeometry,
          features: [hoverGeometry.features[1]],
        },
      },
    });
    onTestFinished(() => wrapper.unmount());
    mapboxMock.fireLoad();
    await flushPromises();

    const hoverListeners = () =>
      mapboxMock.mockMap.on.mock.calls.filter(
        ([event]) => event === "mouseenter" || event === "mouseleave",
      );
    const initialListeners = [...hoverListeners()];
    expect(initialListeners.length).toBeGreaterThan(0);
    mapboxMock.fireHover(["most-recent-alerts-polygon", "secondary-data"]);
    expect(canvas.style.cursor).toBe("pointer");

    const vm = wrapper.vm as unknown as {
      handleBasemapChange: (basemap: { id: string; style: string }) => void;
    };
    const idleCallsBefore = mapboxMock.mockMap.once.mock.calls.length;
    const layersBefore = mapboxMock.mockMap.addLayer.mock.calls.length;
    vm.handleBasemapChange({
      id: "satellite",
      style: "mapbox://styles/mapbox/satellite-v9",
    });
    // Run the idle callback that rebuilds map content after the style change.
    const rebuild = mapboxMock.mockMap.once.mock.calls
      .slice(idleCallsBefore)
      .find(([event]) => event === "idle")?.[1] as () => void;
    expect(rebuild).toBeTypeOf("function");
    rebuild();
    await flushPromises();
    expect(mapboxMock.mockMap.addLayer.mock.calls.length).toBeGreaterThan(
      layersBefore,
    );
    expect(hoverListeners()).toEqual(initialListeners);

    mapboxMock.fireHover(["secondary-data"]);
    expect(canvas.style.cursor).toBe("pointer");
    mapboxMock.fireHover([]);
    expect(canvas.style.cursor).toBe("");
  });

  it("preserves secondary hover when the primary line buffer finds no features", async () => {
    const canvas = document.createElement("canvas");
    const getCanvas = mapboxMock.mockMap.getCanvas.getMockImplementation()!;
    const getLayer = mapboxMock.mockMap.getLayer.getMockImplementation()!;
    mapboxMock.mockMap.getCanvas.mockReturnValue(canvas);
    onTestFinished(() => {
      mapboxMock.mockMap.getCanvas.mockImplementation(getCanvas);
      mapboxMock.mockMap.getLayer.mockImplementation(getLayer);
    });
    const wrapper = mountComponent({
      ...baseProps,
      secondaryData: {
        ...hoverGeometry,
        features: [hoverGeometry.features[0]],
      },
      alertsData: {
        ...baseProps.alertsData,
        mostRecentAlerts: {
          type: "FeatureCollection",
          features: [hoverGeometry.features[2]],
        },
      },
    });
    onTestFinished(() => wrapper.unmount());
    mapboxMock.fireLoad();
    await flushPromises();
    const move = mapboxMock.mockMap.on.mock.calls.find(
      ([event, callback]) =>
        event === "mousemove" && typeof callback === "function",
    )?.[1] as (event: unknown) => void;
    mapboxMock.mockMap.getLayer.mockImplementation(
      (id?: string) => ({ id }) as never,
    );
    mapboxMock.fireHover(["secondary-data"]);
    move({ point: { x: 100, y: 100 } });
    expect(canvas.style.cursor).toBe("pointer");
    expect(mapboxMock.mockMap.queryRenderedFeatures).toHaveBeenCalled();
    mapboxMock.fireHover([]);
    move({ point: { x: 100, y: 100 } });
    expect(canvas.style.cursor).toBe("");
  });

  it("initialises Mapbox and adds controls", async () => {
    const wrapper = mountComponent();

    // Trigger component's onMounted -> map 'load' event
    mapboxMock.fireLoad();
    await flushPromises();

    expect(mapboxMock.Map).toHaveBeenCalledTimes(1);
    expect(mapboxMock.addControl).toHaveBeenCalled();
    expect(wrapper.exists()).toBe(true);
  });

  it("initializes the map from lat, lng, and zoom query params", async () => {
    mockRoute.value = {
      params: {},
      query: { lat: "-3.12000", lng: "-60.02000", zoom: "11.50" },
    };

    mountComponent();

    expect(mapboxMock.Map).toHaveBeenCalledWith(
      expect.objectContaining({
        center: [-60.02, -3.12],
        zoom: 11.5,
      }),
    );
  });

  it("uses the view default camera when a feature id is also in the query", async () => {
    mockRoute.value = {
      params: {},
      query: {
        alertId: "alert-1",
        lat: "-3.12000",
        lng: "-60.02000",
        zoom: "11.50",
      },
    };

    mountComponent();

    expect(mapboxMock.Map).toHaveBeenCalledWith(
      expect.objectContaining({
        center: [0, -15],
        zoom: 2,
      }),
    );
  });

  it("keeps MultiPolygon alerts in the polygon source through filtering and reset", async () => {
    mockRoute.value = {
      path: "/alerts/test_alerts",
      params: { tablename: "test_alerts" },
      query: {},
    };
    const props = JSON.parse(JSON.stringify(baseProps));
    const multiPolygonAlert = {
      id: "multipolygon-alert",
      type: "Feature",
      geometry: {
        type: "MultiPolygon",
        coordinates: [
          [
            [
              [0, 0],
              [1, 0],
              [1, 1],
              [0, 0],
            ],
          ],
          [
            [
              [2, 2],
              [3, 2],
              [3, 3],
              [2, 2],
            ],
          ],
        ],
      },
      properties: {
        _id: "multipolygon-alert",
        alertID: "multipolygon-alert",
        YYYYMM: "202403",
        geographicCentroid: "1.5, 1.5",
      },
    };
    const olderMultiPolygonAlert = {
      ...multiPolygonAlert,
      id: "older-multipolygon-alert",
      properties: {
        ...multiPolygonAlert.properties,
        _id: "older-multipolygon-alert",
        alertID: "older-multipolygon-alert",
        YYYYMM: "202402",
      },
    };
    props.alertsData.mostRecentAlerts.features.push(multiPolygonAlert);
    props.alertsData.mostRecentAlerts.features.push(olderMultiPolygonAlert);
    props.alertsStatistics = {
      ...props.alertsStatistics,
      allDates: ["02-2024", "03-2024"],
      earliestAlertsDate: "02-2024",
      twelveMonthsBefore: "02-2024",
    };

    const wrapper = mountComponent(props);
    mapboxMock.fireLoad();
    await flushPromises();

    expect(mapboxMock.mockMap.addSource).toHaveBeenCalledWith(
      "most-recent-alerts-polygon",
      expect.objectContaining({
        data: expect.objectContaining({
          features: [multiPolygonAlert, olderMultiPolygonAlert],
        }),
      }),
    );

    const polygonSource = { setData: vi.fn(), type: "geojson" };
    mapboxMock.mockMap.getSource.mockImplementation((sourceId) =>
      sourceId === "most-recent-alerts-polygon" ? polygonSource : false,
    );

    const testWindow = window as unknown as {
      _testHandleDateRangeChanged?: (range: [string, string]) => void;
    };
    testWindow._testHandleDateRangeChanged?.(["03-2024", "03-2024"]);
    await flushPromises();

    expect(polygonSource.setData).toHaveBeenLastCalledWith({
      type: "FeatureCollection",
      features: [multiPolygonAlert],
    });

    mapboxMock.fireClick("most-recent-alerts-polygon", {
      features: [multiPolygonAlert],
      point: { x: 10, y: 10 },
    });
    await flushPromises();

    expect(mapboxMock.setFeatureState).toHaveBeenCalledWith(
      { source: "most-recent-alerts-polygon", id: "multipolygon-alert" },
      { selected: true },
    );

    const vm = wrapper.vm as unknown as {
      resetToInitialState: () => void;
    };
    vm.resetToInitialState();
    await flushPromises();

    expect(polygonSource.setData).toHaveBeenCalledWith({
      type: "FeatureCollection",
      features: [multiPolygonAlert, olderMultiPolygonAlert],
    });
  });

  it("uses the selected basemap access token", async () => {
    const wrapper = mountComponent();
    mapboxMock.fireLoad();
    await flushPromises();

    const vm = wrapper.vm as unknown as {
      handleBasemapChange: (basemap: {
        id: string;
        style: string;
        access_token: string;
      }) => void;
    };

    vm.handleBasemapChange({
      id: "satellite",
      style: "mapbox://styles/mapbox/satellite-v9",
      access_token: "pk.other",
    });

    expect(mapboxMock.getAccessToken()).toBe("pk.other");
    expect(mapboxMock.mockMap.setStyle).toHaveBeenCalledWith(
      "mapbox://styles/mapbox/satellite-v9",
    );
  });

  it("selects an alert feature and opens sidebar", async () => {
    const props = JSON.parse(JSON.stringify(baseProps));
    props.alertsData.mostRecentAlerts.features.push({
      id: "alert1",
      type: "Feature",
      geometry: { type: "Point", coordinates: [0, 0] },
      properties: { alertID: "alert1", YYYYMM: "202401" },
    });

    const wrapper = mountComponent(props, {
      stubs: {
        ViewSidebar: {
          props: ["showSidebar", "feature"],
          template:
            "<div v-if='showSidebar'>Sidebar {{ feature?.alertID }}</div>",
        },
      },
    });

    mapboxMock.fireLoad();
    await flushPromises();

    // fire click on mock layer
    mapboxMock.fireClick("most-recent-alerts-point", {
      features: props.alertsData.mostRecentAlerts.features,
      point: { x: 10, y: 10 },
    });
    await flushPromises();

    const vm = wrapper.vm as unknown as { showSidebar: boolean };
    expect(vm.showSidebar).toBe(true);
    expect(mapboxMock.setFeatureState).toHaveBeenCalledWith(
      { source: "most-recent-alerts-point", id: "alert1" },
      { selected: true },
    );
  });

  it("adds a pulsing halo on most recent alert points and clusters", async () => {
    const props = JSON.parse(JSON.stringify(baseProps));
    props.alertsData.mostRecentAlerts.features.push({
      id: "alert1",
      type: "Feature",
      geometry: { type: "Point", coordinates: [0, 0] },
      properties: { alertID: "alert1", YYYYMM: "202401" },
    });

    mountComponent(props);
    mapboxMock.fireLoad();
    await flushPromises();

    const layerIds = mapboxMock.layers.map((layer) => layer.id);
    expect(layerIds).toContain("most-recent-alerts-point-halo");
    expect(layerIds).toContain("most-recent-alerts-point-clusters-halo");
    const clusterHalo = mapboxMock.layers.find(
      (layer) => layer.id === "most-recent-alerts-point-clusters-halo",
    );
    expect(clusterHalo?.type).toBe("circle");
    expect(clusterHalo?.filter).toEqual(["has", "point_count"]);

    const callsBefore = mapboxMock.setFeatureState.mock.calls.length;
    mapboxMock.fireClick("most-recent-alerts-point-halo", {
      features: props.alertsData.mostRecentAlerts.features,
      point: { x: 10, y: 10 },
    });
    await flushPromises();
    expect(mapboxMock.setFeatureState.mock.calls.length).toBe(callsBefore);
  });

  it("adds 3D terrain when mapbox3d is true", async () => {
    const propsWithTerrain = { ...baseProps, mapbox3d: true };

    mountComponent(propsWithTerrain);

    mapboxMock.fireLoad();
    await flushPromises();

    expect(mapboxMock.mockMap.addSource).toHaveBeenCalledWith("mapbox-dem", {
      type: "raster-dem",
      url: "mapbox://mapbox.mapbox-terrain-dem-v1",
      tileSize: 512,
      maxzoom: 14,
    });
    expect(mapboxMock.mockMap.setTerrain).toHaveBeenCalledWith({
      source: "mapbox-dem",
      exaggeration: 1.5,
    });
  });

  it("uses custom terrain exaggeration value", async () => {
    const propsWithCustomExaggeration = {
      ...baseProps,
      mapbox3d: true,
      mapbox3dTerrainExaggeration: 3.0,
    };

    mountComponent(propsWithCustomExaggeration);

    mapboxMock.fireLoad();
    await flushPromises();

    expect(mapboxMock.mockMap.setTerrain).toHaveBeenCalledWith({
      source: "mapbox-dem",
      exaggeration: 3.0,
    });
  });

  it("updates sidebar statistics when date range changes", async () => {
    const props = JSON.parse(JSON.stringify(baseProps));
    props.alertsStatistics = {
      ...props.alertsStatistics,
      allDates: ["01-2024", "02-2024", "03-2024"],
      earliestAlertsDate: "01-2024",
      twelveMonthsBefore: "01-2024",
      alertsTotal: 6,
      recentAlertsDate: "03-2024",
      recentAlertsNumber: 2,
      alertsPerMonth: {
        "01-2024": 2,
        "02-2024": 4,
        "03-2024": 6,
      },
      hectaresTotal: "9.00",
      hectaresPerMonth: {
        "01-2024": 3,
        "02-2024": 6,
        "03-2024": 9,
      },
    };

    const wrapper = mountComponent(props, {
      stubs: {
        ViewSidebar: {
          props: ["alertsStatistics"],
          template: `<div data-testid="stats-total">{{ alertsStatistics?.alertsTotal }}</div>`,
        },
      },
    });

    mapboxMock.fireLoad();
    await flushPromises();
    expect(wrapper.get('[data-testid="stats-total"]').text()).toBe("6");

    const testWindow = window as unknown as {
      _testHandleDateRangeChanged?: (range: [string, string]) => void;
    };
    testWindow._testHandleDateRangeChanged?.(["02-2024", "03-2024"]);
    await flushPromises();

    expect(wrapper.get('[data-testid="stats-total"]').text()).toBe("4");
  });

  describe("Incidents functionality", () => {
    it("renders incidents controls", async () => {
      const wrapper = mount(AlertsDashboard, {
        props: baseProps,
        global: {
          plugins: [i18n],
          stubs: {
            ViewSidebar: true,
            MapLegend: true,
            BasemapSelector: true,
            IncidentsSidebar: true,
          },
        },
      });

      mapboxMock.fireLoad();
      await flushPromises();

      const incidentsControls = wrapper.find(".incidents-controls");
      expect(incidentsControls.exists()).toBe(true);
    });

    it("hides incidents controls when the user cannot access incidents", async () => {
      canAccessIncidents.value = false;

      const wrapper = mount(AlertsDashboard, {
        props: baseProps,
        global: {
          plugins: [i18n],
          stubs: {
            ViewSidebar: true,
            MapLegend: true,
            BasemapSelector: true,
            IncidentsSidebar: true,
          },
        },
      });

      mapboxMock.fireLoad();
      await flushPromises();

      expect(wrapper.find(".incidents-controls").exists()).toBe(false);
      expect(
        wrapper.find('[data-testid="incidents-view-button"]').exists(),
      ).toBe(false);
      expect(
        wrapper.find('[data-testid="incidents-bbox-button"]').exists(),
      ).toBe(false);
      expect(
        wrapper.find('[data-testid="incidents-multiselect-button"]').exists(),
      ).toBe(false);
      expect(
        wrapper.find('[data-testid="incidents-deselect-button"]').exists(),
      ).toBe(false);
      expect(
        wrapper.find('[data-testid="incidents-create-button"]').exists(),
      ).toBe(false);
    });

    it("does not fetch incidents when the user cannot access incidents", async () => {
      canAccessIncidents.value = false;

      mount(AlertsDashboard, {
        props: baseProps,
        global: {
          plugins: [i18n],
          stubs: {
            ViewSidebar: true,
            MapLegend: true,
            BasemapSelector: true,
            IncidentsSidebar: true,
          },
        },
      });

      mapboxMock.fireLoad();
      await flushPromises();

      const incidentRequests = hoisted.mockFetch.mock.calls.filter(
        ([url]) =>
          typeof url === "string" && String(url).includes("/api/incidents"),
      );
      expect(incidentRequests).toHaveLength(0);
    });

    it("does not open an incident from the URL when the user cannot access incidents", async () => {
      canAccessIncidents.value = false;
      mockRoute.value = { params: {}, query: { incidentId: "inc-123" } };

      mount(AlertsDashboard, {
        props: baseProps,
        global: {
          plugins: [i18n],
          stubs: {
            ViewSidebar: true,
            MapLegend: true,
            BasemapSelector: true,
            IncidentsSidebar: true,
          },
        },
      });

      mapboxMock.fireLoad();
      await flushPromises();

      expect(hoisted.mockFetch).not.toHaveBeenCalledWith(
        "/api/incidents/inc-123",
      );
      expect(hoisted.mockFetch).not.toHaveBeenCalledWith(
        "/api/incidents/inc-123",
        expect.anything(),
      );
    });

    it("does not show the remove incident modal when the user cannot access incidents", async () => {
      canAccessIncidents.value = false;

      const wrapper = mount(AlertsDashboard, {
        props: baseProps,
        global: {
          plugins: [i18n],
          stubs: {
            ViewSidebar: true,
            MapLegend: true,
            BasemapSelector: true,
            IncidentsSidebar: true,
          },
        },
      });

      mapboxMock.fireLoad();
      await flushPromises();

      const vm = wrapper.vm as unknown as { showRemoveIncidentModal: boolean };
      vm.showRemoveIncidentModal = true;
      await flushPromises();

      expect(
        wrapper.find('[data-testid="remove-incident-modal"]').exists(),
      ).toBe(false);
    });

    it("fetches incidents on load when the user can access incidents", async () => {
      mount(AlertsDashboard, {
        props: baseProps,
        global: {
          plugins: [i18n],
          stubs: {
            ViewSidebar: true,
            MapLegend: true,
            BasemapSelector: true,
            IncidentsSidebar: true,
          },
        },
      });

      mapboxMock.fireLoad();
      await flushPromises();

      expect(hoisted.mockFetch).toHaveBeenCalledWith(
        "/api/incidents",
        expect.objectContaining({
          query: expect.objectContaining({
            parent_alerts_table: "test_alerts",
          }),
        }),
      );
    });

    it("toggles incidents sidebar when view incidents button is clicked", async () => {
      const wrapper = mount(AlertsDashboard, {
        props: baseProps,
        global: {
          plugins: [i18n],
          stubs: {
            ViewSidebar: true,
            MapLegend: true,
            BasemapSelector: true,
            IncidentsSidebar: {
              props: ["show"],
              template:
                '<div v-if="show" class="incidents-sidebar">Sidebar</div>',
            },
          },
        },
      });

      mapboxMock.fireLoad();
      await flushPromises();

      const viewIncidentsButton = wrapper.find(
        '[data-testid="incidents-view-button"]',
      );
      await viewIncidentsButton.trigger("click");
      await flushPromises();

      const sidebar = wrapper.find(".incidents-sidebar");
      expect(sidebar.exists()).toBe(true);
    });

    it("toggles multi-select mode", async () => {
      const wrapper = mount(AlertsDashboard, {
        props: baseProps,
        global: {
          plugins: [i18n],
          stubs: {
            ViewSidebar: true,
            MapLegend: true,
            BasemapSelector: true,
            IncidentsSidebar: true,
          },
        },
      });

      mapboxMock.fireLoad();
      await flushPromises();

      const multiSelectButton = wrapper.find(
        '[data-testid="incidents-multiselect-button"]',
      );

      // Initially not active
      expect(multiSelectButton.classes()).not.toContain("active");

      // Click to enable
      await multiSelectButton.trigger("click");
      await flushPromises();

      // Should be active
      expect(multiSelectButton.classes()).toContain("active");

      // Click again to disable
      await multiSelectButton.trigger("click");
      await flushPromises();

      // Should not be active
      expect(multiSelectButton.classes()).not.toContain("active");
    });

    it("toggles bounding box mode", async () => {
      const wrapper = mount(AlertsDashboard, {
        props: baseProps,
        global: {
          plugins: [i18n],
          stubs: {
            ViewSidebar: true,
            MapLegend: true,
            BasemapSelector: true,
            IncidentsSidebar: true,
          },
        },
      });

      mapboxMock.fireLoad();
      await flushPromises();

      const boundingBoxButton = wrapper.find(
        '[data-testid="incidents-bbox-button"]',
      );

      // Initially not active
      expect(boundingBoxButton.classes()).not.toContain("active");

      // Click to enable
      await boundingBoxButton.trigger("click");
      await flushPromises();

      // Should be active
      expect(boundingBoxButton.classes()).toContain("active");
    });

    it("opens create incident sidebar when create button is clicked with selections", async () => {
      const wrapper = mount(AlertsDashboard, {
        props: baseProps,
        global: {
          plugins: [i18n],
          stubs: {
            ViewSidebar: true,
            MapLegend: true,
            BasemapSelector: true,
            IncidentsSidebar: {
              props: ["show", "openWithCreateForm"],
              template:
                '<div v-if="show" class="incidents-sidebar"><div v-if="openWithCreateForm" class="create-form">Create Form</div></div>',
            },
          },
        },
      });

      mapboxMock.fireLoad();
      await flushPromises();

      // Set up selected sources (simulate selection)
      // Access the component instance to set selected sources
      const vm = wrapper.vm as unknown as {
        selectedSources: Array<{
          source_table: string;
          source_id: string;
          feature_type: "alert" | "secondary";
        }>;
      };
      vm.selectedSources = [
        {
          source_table: "mapeo_data",
          source_id: "test1",
          feature_type: "secondary",
        },
      ];
      await flushPromises();

      const createButton = wrapper.find(
        '[data-testid="incidents-create-button"]',
      );

      // Button should not be disabled when sources are selected
      expect(createButton.attributes("disabled")).toBeUndefined();

      await createButton.trigger("click");
      await flushPromises();

      const sidebar = wrapper.find(".incidents-sidebar");
      expect(sidebar.exists()).toBe(true);

      const createForm = wrapper.find(".create-form");
      expect(createForm.exists()).toBe(true);
    });

    it("disables create button when no sources are selected", async () => {
      const wrapper = mount(AlertsDashboard, {
        props: baseProps,
        global: {
          plugins: [i18n],
          stubs: {
            ViewSidebar: true,
            MapLegend: true,
            BasemapSelector: true,
            IncidentsSidebar: true,
          },
        },
      });

      mapboxMock.fireLoad();
      await flushPromises();

      const createButton = wrapper.find(
        '[data-testid="incidents-create-button"]',
      );

      // Button should be disabled when no sources are selected
      expect(createButton.attributes("disabled")).toBeDefined();
    });

    it("disables multi-select when bounding box is enabled", async () => {
      const wrapper = mount(AlertsDashboard, {
        props: baseProps,
        global: {
          plugins: [i18n],
          stubs: {
            ViewSidebar: true,
            MapLegend: true,
            BasemapSelector: true,
            IncidentsSidebar: true,
          },
        },
      });

      mapboxMock.fireLoad();
      await flushPromises();

      const multiSelectButton = wrapper.find(
        '[data-testid="incidents-multiselect-button"]',
      );
      const boundingBoxButton = wrapper.find(
        '[data-testid="incidents-bbox-button"]',
      );

      // Enable multi-select
      await multiSelectButton.trigger("click");
      await flushPromises();
      expect(multiSelectButton.classes()).toContain("active");

      // Enable bounding box (should disable multi-select)
      await boundingBoxButton.trigger("click");
      await flushPromises();

      expect(boundingBoxButton.classes()).toContain("active");
      expect(multiSelectButton.classes()).not.toContain("active");
    });

    it("disables bounding box when multi-select is enabled", async () => {
      const wrapper = mount(AlertsDashboard, {
        props: baseProps,
        global: {
          plugins: [i18n],
          stubs: {
            ViewSidebar: true,
            MapLegend: true,
            BasemapSelector: true,
            IncidentsSidebar: true,
          },
        },
      });

      mapboxMock.fireLoad();
      await flushPromises();

      const multiSelectButton = wrapper.find(
        '[data-testid="incidents-multiselect-button"]',
      );
      const boundingBoxButton = wrapper.find(
        '[data-testid="incidents-bbox-button"]',
      );

      // Enable bounding box
      await boundingBoxButton.trigger("click");
      await flushPromises();
      expect(boundingBoxButton.classes()).toContain("active");

      // Enable multi-select (should disable bounding box)
      await multiSelectButton.trigger("click");
      await flushPromises();

      expect(multiSelectButton.classes()).toContain("active");
      expect(boundingBoxButton.classes()).not.toContain("active");
    });

    it("restores view sidebar when incident mode is fully disabled", async () => {
      const wrapper = mount(AlertsDashboard, {
        props: baseProps,
        global: {
          plugins: [i18n],
          stubs: {
            ViewSidebar: true,
            MapLegend: true,
            BasemapSelector: true,
            IncidentsSidebar: true,
          },
        },
      });

      mapboxMock.fireLoad();
      await flushPromises();

      const vm = wrapper.vm as unknown as { showSidebar: boolean };
      const multiSelectButton = wrapper.find(
        '[data-testid="incidents-multiselect-button"]',
      );

      await multiSelectButton.trigger("click");
      await flushPromises();
      expect(vm.showSidebar).toBe(false);

      await multiSelectButton.trigger("click");
      await flushPromises();
      expect(vm.showSidebar).toBe(true);
    });

    it("does not open feature sidebar on map click while incidents sidebar is open", async () => {
      const props = JSON.parse(JSON.stringify(baseProps));
      props.alertsData.mostRecentAlerts.features.push({
        id: "alert1",
        type: "Feature",
        geometry: { type: "Point", coordinates: [0, 0] },
        properties: { alertID: "alert1", YYYYMM: "202401" },
      });

      const wrapper = mount(AlertsDashboard, {
        props,
        global: {
          plugins: [i18n],
          stubs: {
            ViewSidebar: true,
            MapLegend: true,
            BasemapSelector: true,
            IncidentsSidebar: true,
          },
        },
      });

      mapboxMock.fireLoad();
      await flushPromises();

      const vm = wrapper.vm as unknown as { showSidebar: boolean };
      vm.showSidebar = false;
      await flushPromises();

      const viewIncidentsButton = wrapper.find(
        '[data-testid="incidents-view-button"]',
      );
      await viewIncidentsButton.trigger("click");
      await flushPromises();

      const callsBefore = mapboxMock.setFeatureState.mock.calls.length;
      mapboxMock.fireClick("most-recent-alerts-point", {
        features: props.alertsData.mostRecentAlerts.features,
        point: { x: 10, y: 10 },
      });
      await flushPromises();

      expect(vm.showSidebar).toBe(false);
      expect(mapboxMock.setFeatureState.mock.calls.length).toBe(callsBefore);
    });

    it("fits the map to incident entry extent when incidentId is in the URL", async () => {
      mockRoute.value = {
        params: {},
        query: { incidentId: "inc-1" },
      };

      const entries = [
        {
          id: "e1",
          collection_id: "inc-1",
          source_table: "test_alerts",
          source_id: "a1",
          source_data: {
            g__type: "Point",
            g__coordinates: "[-59.81, 2.49]",
          },
          added_by: "u",
          added_at: "2024-01-01T00:00:00.000Z",
        },
        {
          id: "e2",
          collection_id: "inc-1",
          source_table: "test_alerts",
          source_id: "a2",
          source_data: {
            g__type: "Point",
            g__coordinates: "[-59.79, 2.51]",
          },
          added_by: "u",
          added_at: "2024-01-01T00:00:00.000Z",
        },
      ];

      hoisted.mockFetch.mockImplementation((url: string) => {
        if (url === "/api/incidents/inc-1") {
          return Promise.resolve({
            incident: {
              id: "inc-1",
              name: "Illegal Mining Co.",
              collection_type: "incident",
              created_at: "2026-08-15T00:00:00.000Z",
              updated_at: "2026-08-15T00:00:00.000Z",
              metadata: {},
            },
            incidentData: {
              collection_id: "inc-1",
              status: "suspected",
              is_active: true,
            },
            entries,
          });
        }
        return Promise.resolve({
          incidents: [],
          total: 0,
          limit: 10,
          offset: 0,
        });
      });

      mount(AlertsDashboard, {
        props: baseProps,
        global: {
          plugins: [i18n],
          stubs: {
            ViewSidebar: true,
            MapLegend: true,
            BasemapSelector: true,
            IncidentsSidebar: true,
          },
        },
      });

      mapboxMock.fireLoad();
      await flushPromises();

      expect(mapboxMock.mockMap.fitBounds).toHaveBeenCalledWith(
        [-59.81, 2.49, -59.79, 2.51],
        { ...INCIDENT_FIT_BOUNDS_OPTIONS },
      );
    });

    it("does not fit bounds for an incident URL when entries have no geometry", async () => {
      mockRoute.value = {
        params: {},
        query: { incidentId: "inc-empty" },
      };

      hoisted.mockFetch.mockImplementation((url: string) => {
        if (url === "/api/incidents/inc-empty") {
          return Promise.resolve({
            incident: {
              id: "inc-empty",
              name: "Empty",
              collection_type: "incident",
              created_at: "2026-08-15T00:00:00.000Z",
              updated_at: "2026-08-15T00:00:00.000Z",
              metadata: {},
            },
            entries: [
              {
                id: "e1",
                collection_id: "inc-empty",
                source_table: "test_alerts",
                source_id: "a1",
                source_data: {},
                added_by: "u",
                added_at: "2024-01-01T00:00:00.000Z",
              },
            ],
          });
        }
        return Promise.resolve({
          incidents: [],
          total: 0,
          limit: 10,
          offset: 0,
        });
      });

      mount(AlertsDashboard, {
        props: baseProps,
        global: {
          plugins: [i18n],
          stubs: {
            ViewSidebar: true,
            MapLegend: true,
            BasemapSelector: true,
            IncidentsSidebar: true,
          },
        },
      });

      mapboxMock.fireLoad();
      await flushPromises();

      expect(mapboxMock.mockMap.fitBounds).not.toHaveBeenCalled();
    });
  });
});
