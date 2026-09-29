import { secondaryGeometry } from "@/tests/fixtures/secondaryGeometry";
import { describe, it, expect, beforeEach, onTestFinished, vi } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";
import VueSlider from "vue-3-slider-component";
import {
  ref,
  reactive,
  computed,
  watch,
  onMounted,
  onBeforeUnmount,
  nextTick,
} from "vue";
// Note: vue-i18n is mocked via module alias in vitest.config.ts
// pointing to /test/helpers/vueI18nMock.ts

import * as mapboxMock from "@/tests/unit/helpers/mapboxMock";

import MapView from "@/components/MapView.vue";
import DownloadMapData from "@/components/shared/downloads/DownloadMapData.vue";
import { useRoute, useI18n, useToast } from "#imports";

import type { FeatureCollection } from "geojson";

vi.mock("@/utils/browserDownload", () => ({
  triggerBrowserDownload: vi.fn(),
}));

const makeFeatureCollection = (
  features: Array<{
    id?: number;
    type: string;
    coordinates: unknown;
    properties?: Record<string, unknown>;
  }>,
): FeatureCollection => ({
  type: "FeatureCollection",
  features: features.map((f) => ({
    type: "Feature" as const,
    id: f.id ?? 1,
    geometry: {
      type: f.type as "Point" | "Polygon",
      coordinates: f.coordinates,
    } as GeoJSON.Geometry,
    properties: f.properties ?? {},
  })),
});

const baseMapData = makeFeatureCollection([
  {
    id: 1,
    type: "Point",
    coordinates: [0, 0],
    properties: {
      _id: "1",
      status: "active",
      "filter-color": "#ff0000",
    },
  },
  {
    id: 2,
    type: "Polygon",
    coordinates: [
      [
        [0, 0],
        [1, 1],
        [1, 0],
        [0, 0],
      ],
    ],
    properties: {
      _id: "2",
      status: "inactive",
      "filter-color": "#00ff00",
    },
  },
]);

// Re-usable minimal props object
const baseProps: InstanceType<typeof MapView>["$props"] = {
  allowedFileExtensions: {
    audio: [],
    image: ["jpg", "png"],
    video: [],
  },
  filterColumn: "status",
  mapStatistics: {
    totalFeatures: 2,
    dateRange: "2024-01-01 to 2024-12-31",
  },
  mapboxAccessToken: "pk.test",
  mapboxBearing: 0,
  mapboxLatitude: 10,
  mapboxLongitude: 10,
  mapboxPitch: 0,
  mapboxProjection: "mercator",
  mapboxStyle: "mapbox://styles/mapbox/streets-v12",
  mapboxZoom: 10,
  mapbox3d: false,
  mapbox3dTerrainExaggeration: 1.5,
  mapData: baseMapData,
  mediaBasePath: "/media",
  planetApiKey: "",
  table: "test_table",
};

Object.assign(globalThis, {
  ref,
  reactive,
  computed,
  watch,
  onMounted,
  onBeforeUnmount,
  nextTick,
});

// Mock useRecordCache composable
const mockFetchRecord = vi.fn().mockResolvedValue({
  _id: "1",
  status: "active",
  name: "Full Record",
  geocoordinates: "[0, 0]",
});

vi.mock("@/composables/useRecordCache", () => ({
  useRecordCache: () => ({
    fetchRecord: mockFetchRecord,
    clearCache: vi.fn(),
    cacheSize: computed(() => 0),
  }),
}));

// Mock useRuntimeConfig for useRecordCache
Object.assign(globalThis, {
  useRuntimeConfig: () => ({
    public: { appApiKey: "test-key" },
  }),
});

// Mock vue-router for route & router injections
const mockRoute = ref({ params: {}, query: {} });
const mockRouter = { replace: vi.fn(), push: vi.fn() };
vi.mock("vue-router", () => ({
  useRoute: () => mockRoute.value,
  useRouter: () => mockRouter,
}));

// Shared global config for all tests
const globalConfig = {
  mocks: {
    $t: (key: string) => key,
    $n: (value: number) => value.toString(),
  },
  stubs: {
    DataFilter: true,
    MapFilterControls: false,
    ViewSidebar: true,
    MapLegend: true,
    BasemapSelector: true,
  },
};

describe("MapView component", () => {
  beforeEach(() => {
    mapboxMock.reset();
    mockRoute.value = { params: {}, query: {} };
    mockRouter.replace.mockClear();
    mockFetchRecord.mockClear();
    mockFetchRecord.mockResolvedValue({
      _id: "1",
      status: "active",
      name: "Full Record",
      geocoordinates: "[0, 0]",
    });
    document.body.innerHTML = '<div id="map"></div>';
  });

  it("adds an automatic primary legend and preserves grouped visibility through layer recreation", async () => {
    const wrapper = mount(MapView, {
      props: {
        ...baseProps,
        mapData: {
          ...baseMapData,
          features: [...baseMapData.features, secondaryGeometry.features[1]],
        },
        secondaryData: secondaryGeometry,
        secondaryDataset: "mapping",
        iconColumn: "icon",
        mediaBasePathIcons: "/icons",
        filterColumn: "status",
      },
      global: globalConfig,
    });
    mapboxMock.fireLoad();
    await flushPromises();
    const vm = wrapper.vm as unknown as {
      mapLegendContent: Array<{ id: string; name: string; visible: boolean }>;
      toggleLayerVisibility: (item: { id: string; visible: boolean }) => void;
      filterValues: (values: string[]) => void;
      handleToggleIcons: () => Promise<void>;
      prepareMapCanvasContent: () => Promise<void>;
    };
    expect(vm.mapLegendContent.map((item) => item.id)).toEqual([
      "data-source",
      "secondary-data",
    ]);
    expect(vm.mapLegendContent[0]).toMatchObject({
      name: "Test table",
      visible: true,
    });
    mapboxMock.mockMap.setLayoutProperty.mockClear();
    vm.toggleLayerVisibility({ id: "data-source", visible: false });
    for (const id of [
      "data-layer-point",
      "data-layer-linestring",
      "data-layer-polygon",
      "data-layer-polygon-stroke",
    ]) {
      expect(mapboxMock.mockMap.setLayoutProperty).toHaveBeenCalledWith(
        id,
        "visibility",
        "none",
      );
    }
    expect(
      mapboxMock.mockMap.setLayoutProperty.mock.calls.every(([id]) =>
        id.startsWith("data-layer"),
      ),
    ).toBe(true);

    vm.filterValues(["missing"]);
    expect(vm.mapLegendContent.some((item) => item.id === "data-source")).toBe(
      true,
    );
    vm.filterValues([]);
    await vm.handleToggleIcons();
    expect(mapboxMock.mockMap.setLayoutProperty).toHaveBeenCalledWith(
      "data-layer-point-halo",
      "visibility",
      "none",
    );
    // Recreate the style's layers as a basemap switch does.
    mapboxMock.layers.length = 0;
    await vm.prepareMapCanvasContent();
    expect(vm.mapLegendContent[0].visible).toBe(false);
    expect(mapboxMock.mockMap.setLayoutProperty).toHaveBeenLastCalledWith(
      "data-layer-polygon-stroke",
      "visibility",
      "none",
    );

    vm.toggleLayerVisibility({ id: "data-source", visible: true });
    expect(mapboxMock.mockMap.setLayoutProperty).toHaveBeenCalledWith(
      "data-layer-point-halo",
      "visibility",
      "visible",
    );
    wrapper.unmount();
  });

  it("provides the primary legend on primary-only maps", async () => {
    const wrapper = mount(MapView, { props: baseProps, global: globalConfig });
    mapboxMock.fireLoad();
    await flushPromises();
    expect(
      wrapper.findComponent({ name: "MapLegend" }).props("mapLegendContent"),
    ).toEqual([
      expect.objectContaining({
        id: "data-source",
        name: "Test table",
        visible: true,
      }),
    ]);
    wrapper.unmount();
  });

  it("keeps configured style entries alongside the primary toggle after the style loads", async () => {
    Object.assign(mapboxMock.mockMap, {
      getPaintProperty: vi.fn(() => "#333333"),
    });
    mapboxMock.mockMap.getLayer.mockImplementation((id?: string) =>
      id === "roads" ? ({ id, type: "line" } as never) : false,
    );
    onTestFinished(() => {
      mapboxMock.mockMap.getLayer.mockReturnValue(false);
      mapboxMock.mockMap.isStyleLoaded.mockReturnValue(true);
    });
    const wrapper = mount(MapView, {
      props: { ...baseProps, mapLegendLayerIds: "roads" },
      global: globalConfig,
    });
    mapboxMock.fireLoad();
    await flushPromises();
    const vm = wrapper.vm as unknown as {
      prepareMapLegendContent: () => void;
      mapLegendContent: Array<{ id: string }>;
    };
    expect(vm.mapLegendContent.map((item) => item.id)).toEqual([
      "data-source",
      "roads",
    ]);
    mapboxMock.mockMap.isStyleLoaded.mockReturnValue(false);
    vm.prepareMapLegendContent();
    expect(vm.mapLegendContent.map((item) => item.id)).toEqual(["data-source"]);
    mapboxMock.mockMap.isStyleLoaded.mockReturnValue(true);
    vm.prepareMapLegendContent();
    expect(vm.mapLegendContent.map((item) => item.id)).toEqual([
      "data-source",
      "roads",
    ]);
    wrapper.unmount();
  });

  it("leaves secondary data intact when primary filters remove every feature", async () => {
    const sources = new Map<
      string,
      { data: FeatureCollection; setData: (data: FeatureCollection) => void }
    >();
    const layers = new Map<
      string,
      { id: string; source: string; layout?: Record<string, unknown> }
    >();
    // Track live map state so removal, data updates and visibility changes
    // after initial installation are observable.
    const statefulMethods = {
      addSource: vi.fn((id: string, source: { data: FeatureCollection }) => {
        sources.set(id, {
          data: JSON.parse(JSON.stringify(source.data)) as FeatureCollection,
          setData(data) {
            this.data = JSON.parse(JSON.stringify(data)) as FeatureCollection;
          },
        });
      }),
      getSource: vi.fn((id: string) => sources.get(id)),
      removeSource: vi.fn((id: string) => sources.delete(id)),
      addLayer: vi.fn((layer: { id: string; source: string }) => {
        layers.set(layer.id, structuredClone(layer));
      }),
      getLayer: vi.fn((id: string) => layers.get(id)),
      removeLayer: vi.fn((id: string) => layers.delete(id)),
      getStyle: vi.fn(() => ({ layers: [...layers.values()] })),
      setLayoutProperty: vi.fn((id: string, name: string, value: unknown) => {
        const layer = layers.get(id);
        if (layer) (layer.layout ??= {})[name] = value;
      }),
    };
    const originalMethods = Object.fromEntries(
      Object.keys(statefulMethods).map((key) => [
        key,
        mapboxMock.mockMap[key as keyof typeof statefulMethods],
      ]),
    );
    Object.assign(mapboxMock.mockMap, statefulMethods);
    onTestFinished(() => Object.assign(mapboxMock.mockMap, originalMethods));

    const wrapper = mount(MapView, {
      props: {
        ...baseProps,
        filterColumn: "status",
        secondaryData: secondaryGeometry,
        secondaryDataset: "mapping",
      },
      global: globalConfig,
    });
    mapboxMock.fireLoad();
    await flushPromises();
    const vm = wrapper.vm as unknown as {
      filterValues: (values: string[]) => void;
      filteredFeatureCollection: FeatureCollection;
    };
    vm.filterValues(["missing"]);
    await flushPromises();
    expect(vm.filteredFeatureCollection.features).toHaveLength(0);
    expect(sources.get("secondary-data")?.data).toEqual(secondaryGeometry);
    for (const id of [
      "secondary-data",
      "secondary-data-line",
      "secondary-data-polygon",
      "secondary-data-stroke",
    ]) {
      expect(layers.get(id)).toMatchObject({
        source: "secondary-data",
        layout: { visibility: "visible" },
      });
    }
    wrapper.unmount();
  });

  it("omits an empty secondary legend and leaves unknown secondary links at the intro", async () => {
    mockRoute.value.query = { secondaryDocId: "missing" };
    const wrapper = mount(MapView, {
      props: {
        ...baseProps,
        secondaryData: { type: "FeatureCollection", features: [] },
      },
      global: globalConfig,
    });
    mapboxMock.fireLoad();
    await flushPromises();
    expect(mockFetchRecord).not.toHaveBeenCalled();
    const vm = wrapper.vm as unknown as {
      showIntroPanel: boolean;
      mapLegendContent: Array<{ id: string }>;
    };
    expect(vm.showIntroPanel).toBe(true);
    expect(
      vm.mapLegendContent.some((item) => item.id === "secondary-data"),
    ).toBe(false);
    wrapper.unmount();
  });

  it("renders secondary geometry with an empty primary and an automatic grouped legend", async () => {
    const wrapper = mount(MapView, {
      props: {
        ...baseProps,
        mapData: { type: "FeatureCollection", features: [] },
        secondaryData: secondaryGeometry,
        secondaryDataset: "camera_deployments",
        mapLegendLayerIds: undefined,
      },
      global: globalConfig,
    });
    mapboxMock.fireLoad();
    await flushPromises();
    expect(
      mapboxMock.layers
        .filter((layer) => layer.source === "secondary-data")
        .map((layer) => layer.type),
    ).toEqual(["circle", "line", "fill", "line"]);
    const vm = wrapper.vm as unknown as {
      mapLegendContent: Array<{ id: string; name: string; visible: boolean }>;
      toggleLayerVisibility: (item: { id: string; visible: boolean }) => void;
      prepareMapCanvasContent: () => Promise<void>;
    };
    expect(vm.mapLegendContent).toEqual([
      expect.objectContaining({
        id: "secondary-data",
        name: "Camera deployments",
      }),
    ]);
    mapboxMock.mockMap.getLayer.mockReturnValue(true);
    vm.toggleLayerVisibility({ id: "secondary-data", visible: false });
    await vm.prepareMapCanvasContent();
    expect(vm.mapLegendContent[0].visible).toBe(false);
    for (const id of [
      "secondary-data",
      "secondary-data-line",
      "secondary-data-polygon",
      "secondary-data-stroke",
    ])
      expect(mapboxMock.mockMap.setLayoutProperty).toHaveBeenCalledWith(
        id,
        "visibility",
        "none",
      );
    const clicks = mapboxMock.mockMap.on.mock.calls.filter(
      ([event, layer]) => event === "click" && layer === "secondary-data-line",
    );
    expect(clicks).toHaveLength(1);
    wrapper.unmount();
    expect(mapboxMock.mockMap.off).toHaveBeenCalledWith(
      "click",
      "secondary-data-line",
      expect.any(Function),
    );
    mapboxMock.mockMap.getLayer.mockReturnValue(false);
  });

  it("distinguishes matching IDs, clears the old source, and ignores late record responses", async () => {
    let resolveOld!: (record: Record<string, unknown>) => void;
    mockFetchRecord.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveOld = resolve;
        }),
    );
    const wrapper = mount(MapView, {
      props: {
        ...baseProps,
        secondaryData: secondaryGeometry,
        secondaryDataset: "camera_deployments",
      },
      global: globalConfig,
    });
    mapboxMock.fireLoad();
    await flushPromises();
    mapboxMock.mockMap.getSource.mockReturnValue(true);
    mapboxMock.fireClick("data-layer-point", {
      features: [baseMapData.features[0]],
    });
    mapboxMock.fireClick("secondary-data", {
      features: [secondaryGeometry.features[0]],
    });
    await flushPromises();
    expect(mockFetchRecord).toHaveBeenLastCalledWith("camera_deployments", "1");
    expect(mockRouter.replace).toHaveBeenLastCalledWith({
      query: { secondaryDocId: "1" },
    });
    expect(mapboxMock.setFeatureState).toHaveBeenCalledWith(
      { source: "data-source", id: 1 },
      { selected: false },
    );
    expect(mapboxMock.setFeatureState).toHaveBeenCalledWith(
      { source: "secondary-data", id: 1 },
      { selected: true },
    );
    const vm = wrapper.vm as unknown as {
      selectedFeature: unknown;
      handleSidebarClose: () => void;
    };
    const current = vm.selectedFeature;
    resolveOld({ _id: "old", name: "Old primary" });
    await flushPromises();
    expect(vm.selectedFeature).toEqual(current);
    mockRoute.value.query = { secondaryDocId: "1" };
    vm.handleSidebarClose();
    expect(mockRouter.replace).toHaveBeenLastCalledWith({ query: {} });
    wrapper.unmount();
  });

  it.each(["1", "line", "multiline", "polygon", "multipolygon"])(
    "restores secondary link %s",
    async (id) => {
      mockRoute.value.query = { secondaryDocId: id };
      const wrapper = mount(MapView, {
        props: {
          ...baseProps,
          secondaryData: secondaryGeometry,
          secondaryDataset: "mapping",
        },
        global: globalConfig,
      });
      mapboxMock.fireLoad();
      await flushPromises();
      expect(mockFetchRecord).toHaveBeenCalledWith("mapping", id);
      expect(
        mapboxMock.mockMap.flyTo.mock.calls.length +
          mapboxMock.mockMap.fitBounds.mock.calls.length,
      ).toBe(1);
      wrapper.unmount();
    },
  );

  it.each([
    ["data-layer-polygon", "data-layer-point"],
    ["data-layer-point", "data-layer-polygon"],
  ])(
    "keeps the pointer over %s after leaving overlapping %s",
    async (remaining, leaving) => {
      const canvas = document.createElement("canvas");
      const getCanvas = mapboxMock.mockMap.getCanvas.getMockImplementation()!;
      mapboxMock.mockMap.getCanvas.mockReturnValue(canvas);
      onTestFinished(() =>
        mapboxMock.mockMap.getCanvas.mockImplementation(getCanvas),
      );
      const wrapper = mount(MapView, {
        props: baseProps,
        global: globalConfig,
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

  it("initializes Mapbox and adds controls", async () => {
    const wrapper = mount(MapView, {
      props: baseProps,
      global: globalConfig,
    });

    // Trigger component's onMounted -> map 'load' event
    mapboxMock.fireLoad();
    await flushPromises();

    expect(mapboxMock.Map).toHaveBeenCalledTimes(1);
    expect(mapboxMock.Map).toHaveBeenCalledWith({
      container: "map",
      style: "mapbox://styles/mapbox/streets-v12",
      projection: "mercator",
      center: [10, 10],
      zoom: 10,
      pitch: 0,
      bearing: 0,
    });
    expect(mapboxMock.addControl).toHaveBeenCalledTimes(3);
    expect(wrapper.exists()).toBe(true);
  });

  it("initializes the map from lat, lng, and zoom query params", async () => {
    mockRoute.value = {
      params: {},
      query: { lat: "-3.12000", lng: "-60.02000", zoom: "11.50" },
    };

    mount(MapView, {
      props: baseProps,
      global: globalConfig,
    });

    expect(mapboxMock.Map).toHaveBeenCalledWith(
      expect.objectContaining({
        center: [-60.02, -3.12],
        zoom: 11.5,
      }),
    );
  });

  it("writes camera query params after the map moves", async () => {
    mapboxMock.mockMap.getCenter.mockReturnValue({ lat: -3.12, lng: -60.02 });
    mapboxMock.mockMap.getZoom.mockReturnValue(11.5);

    mount(MapView, {
      props: baseProps,
      global: globalConfig,
    });
    mapboxMock.fireMapEvent("moveend");
    await flushPromises();

    expect(mockRouter.replace).toHaveBeenCalledWith({
      query: {
        lat: "-3.12000",
        lng: "-60.02000",
        zoom: "11.50",
      },
    });
  });

  it("adds 3D terrain when mapbox3d is true", async () => {
    const propsWithTerrain = { ...baseProps, mapbox3d: true };

    mount(MapView, {
      props: propsWithTerrain,
      global: globalConfig,
    });

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
      mapbox3dTerrainExaggeration: 2.5,
    };

    mount(MapView, {
      props: propsWithCustomExaggeration,
      global: globalConfig,
    });

    mapboxMock.fireLoad();
    await flushPromises();

    expect(mapboxMock.mockMap.setTerrain).toHaveBeenCalledWith({
      source: "mapbox-dem",
      exaggeration: 2.5,
    });
  });

  it("adds data source and layers for Point features", async () => {
    mount(MapView, {
      props: baseProps,
      global: globalConfig,
    });

    mapboxMock.fireLoad();
    await flushPromises();

    expect(mapboxMock.mockMap.addSource).toHaveBeenCalledWith(
      "data-source",
      expect.objectContaining({
        type: "geojson",
        data: expect.objectContaining({
          type: "FeatureCollection",
        }),
      }),
    );

    expect(mapboxMock.mockMap.addLayer).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "data-layer-point",
        type: "circle",
        source: "data-source",
      }),
    );
  });

  it("adds layers for Polygon features", async () => {
    mount(MapView, {
      props: baseProps,
      global: globalConfig,
    });

    mapboxMock.fireLoad();
    await flushPromises();

    expect(mapboxMock.mockMap.addLayer).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "data-layer-polygon",
        type: "fill",
        source: "data-source",
        filter: ["==", "$type", "Polygon"],
      }),
    );
  });

  it("adds the polygon layer for MultiPolygon features", async () => {
    const props = {
      ...baseProps,
      mapData: makeFeatureCollection([
        {
          id: 3,
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
          properties: { _id: "3", "filter-color": "#00ff00" },
        },
      ]),
    };

    mount(MapView, { props, global: globalConfig });
    mapboxMock.fireLoad();
    await flushPromises();

    expect(mapboxMock.mockMap.addLayer).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "data-layer-polygon",
        type: "fill",
        source: "data-source",
        filter: ["==", "$type", "Polygon"],
      }),
    );
  });

  it("filters data when filter values change", async () => {
    const wrapper = mount(MapView, {
      props: baseProps,
      global: globalConfig,
    });

    mapboxMock.fireLoad();
    await flushPromises();

    // Simulate filter change by calling the component method directly
    const vm = wrapper.vm as unknown as {
      filteredFeatureCollection: FeatureCollection;
      filterValues: (values: string[]) => void;
    };

    vm.filterValues(["active"]);
    await flushPromises();

    expect(vm.filteredFeatureCollection.features).toHaveLength(1);
    expect(vm.filteredFeatureCollection.features[0].properties?.status).toBe(
      "active",
    );
  });

  it("shows all data when 'null' is in filter values", async () => {
    const wrapper = mount(MapView, {
      props: baseProps,
      global: globalConfig,
    });

    mapboxMock.fireLoad();
    await flushPromises();

    const filterControls = wrapper.findComponent({
      name: "MapFilterControls",
    });
    await filterControls.vm.$emit("filter", ["null"]);
    await flushPromises();

    const vm = wrapper.vm as unknown as {
      filteredFeatureCollection: FeatureCollection;
    };
    expect(vm.filteredFeatureCollection.features).toHaveLength(2);
  });

  it("passes filtered feature collection and stats to ViewSidebar when filter is applied", async () => {
    const wrapper = mount(MapView, {
      props: baseProps,
      global: {
        ...globalConfig,
        stubs: {
          ...globalConfig.stubs,
          ViewSidebar: {
            name: "ViewSidebar",
            props: ["mapFeatureCollection", "mapStatistics"],
            template: "<div></div>",
          },
        },
      },
    });

    mapboxMock.fireLoad();
    await flushPromises();

    const vm = wrapper.vm as unknown as {
      filterValues: (values: string[]) => void;
    };
    vm.filterValues(["active"]);
    await flushPromises();

    const sidebar = wrapper.findComponent({ name: "ViewSidebar" });
    expect(sidebar.props("mapFeatureCollection").features).toHaveLength(1);
    expect(
      sidebar.props("mapFeatureCollection").features[0].properties?.status,
    ).toBe("active");
    expect(sidebar.props("mapStatistics").totalFeatures).toBe(1);
  });

  it.each(["csv", "geojson", "kml"])(
    "exports the selected map dates as %s and restores the full range on reset (#645)",
    async (format) => {
      const fetchExport = vi.fn().mockResolvedValue(new Blob());
      vi.stubGlobal("$fetch", fetchExport);
      vi.stubGlobal("useI18n", useI18n);
      vi.stubGlobal("useToast", useToast);
      const originalRoute = useRoute();
      onTestFinished(() => {
        vi.unstubAllGlobals();
        vi.mocked(useRoute).mockReturnValue(originalRoute);
      });
      vi.mocked(useRoute).mockReturnValue({
        params: { tablename: "test_data" },
        query: {},
        path: "/map/test_data",
      });
      const wrapper = mount(MapView, {
        props: {
          ...baseProps,
          table: "test_data",
          timestampColumn: "observed_at",
          mapData: makeFeatureCollection([
            {
              type: "Point",
              coordinates: [0, 0],
              properties: { observed_at: "2024-01-15" },
            },
            {
              type: "Point",
              coordinates: [1, 1],
              properties: { observed_at: "2024-02-15" },
            },
            {
              type: "Point",
              coordinates: [2, 2],
              properties: {
                observed_at: new Date(
                  new Date(2024, 1, 1).getTime() - 1,
                ).toISOString(),
              },
            },
          ]),
        },
        global: {
          ...globalConfig,
          stubs: {
            ...globalConfig.stubs,
            ViewSidebar: false,
            TimestampFilter: false,
            AdminConfigGear: true,
          },
        },
      });
      mapboxMock.fireLoad();
      await flushPromises();

      await wrapper.get('[data-testid="toggle-date-filter"]').trigger("click");
      await flushPromises();
      const slider = wrapper.findComponent(VueSlider);
      slider.vm.$emit("drag-start");
      slider.vm.$emit("update:modelValue", ["2024-02", "2024-02"]);
      await flushPromises();

      const download = wrapper.findComponent(DownloadMapData);
      const exportButton =
        download.findAll("button")[["csv", "geojson", "kml"].indexOf(format)];
      expect(
        (download.props("dataForDownload") as FeatureCollection).features,
      ).toHaveLength(1);
      await exportButton.trigger("click");
      await flushPromises();
      expect(fetchExport).toHaveBeenLastCalledWith("/api/test_data/export", {
        params: {
          format,
          view_type: "map",
          minDate: new Date(2024, 1, 1).toISOString(),
          maxDate: new Date(2024, 2, 0, 23, 59, 59, 999).toISOString(),
        },
        responseType: "blob",
      });

      await wrapper.get('[data-testid="reset-date-button"]').trigger("click");
      await flushPromises();
      expect(
        (download.props("dataForDownload") as FeatureCollection).features,
      ).toHaveLength(3);
      await exportButton.trigger("click");
      await flushPromises();
      expect(fetchExport).toHaveBeenLastCalledWith("/api/test_data/export", {
        params: {
          format,
          view_type: "map",
          minDate: new Date(2024, 0, 1).toISOString(),
          maxDate: new Date(2024, 2, 0, 23, 59, 59, 999).toISOString(),
        },
        responseType: "blob",
      });
      wrapper.unmount();
    },
  );

  it("does not rebuild map layers when opening the date filter (#684)", async () => {
    const wrapper = mount(MapView, {
      props: {
        ...baseProps,
        timestampColumn: "observed_at",
        mapData: makeFeatureCollection([
          {
            type: "Point",
            coordinates: [0, 0],
            properties: { observed_at: "2024-01-15" },
          },
          {
            type: "Point",
            coordinates: [1, 1],
            properties: { observed_at: "2024-02-15" },
          },
        ]),
      },
      global: {
        ...globalConfig,
        stubs: {
          ...globalConfig.stubs,
          TimestampFilter: false,
        },
      },
    });
    mapboxMock.fireLoad();
    await flushPromises();

    const addSourceCalls = mapboxMock.mockMap.addSource.mock.calls.length;
    const removeSourceCalls = mapboxMock.mockMap.removeSource.mock.calls.length;

    await wrapper.get('[data-testid="toggle-date-filter"]').trigger("click");
    await flushPromises();

    expect(mapboxMock.mockMap.addSource.mock.calls.length).toBe(addSourceCalls);
    expect(mapboxMock.mockMap.removeSource.mock.calls.length).toBe(
      removeSourceCalls,
    );
    wrapper.unmount();
  });

  it("keeps an applied date filter when switching to the column filter and back (#684)", async () => {
    const wrapper = mount(MapView, {
      props: {
        ...baseProps,
        timestampColumn: "observed_at",
        mapData: makeFeatureCollection([
          {
            type: "Point",
            coordinates: [0, 0],
            properties: { observed_at: "2024-01-15" },
          },
          {
            type: "Point",
            coordinates: [1, 1],
            properties: { observed_at: "2024-02-15" },
          },
          {
            type: "Point",
            coordinates: [2, 2],
            properties: {
              observed_at: new Date(
                new Date(2024, 1, 1).getTime() - 1,
              ).toISOString(),
            },
          },
        ]),
      },
      global: {
        ...globalConfig,
        stubs: {
          ...globalConfig.stubs,
          TimestampFilter: false,
          ViewSidebar: {
            name: "ViewSidebar",
            props: ["mapFeatureCollection", "mapStatistics"],
            template: "<div></div>",
          },
        },
      },
    });
    mapboxMock.fireLoad();
    await flushPromises();

    await wrapper.get('[data-testid="toggle-date-filter"]').trigger("click");
    await flushPromises();
    const slider = wrapper.findComponent(VueSlider);
    slider.vm.$emit("drag-start");
    slider.vm.$emit("update:modelValue", ["2024-02", "2024-02"]);
    await flushPromises();

    const sidebar = wrapper.findComponent({ name: "ViewSidebar" });
    expect(sidebar.props("mapFeatureCollection").features).toHaveLength(1);

    await wrapper.get('[data-testid="toggle-data-filter"]').trigger("click");
    await wrapper.get('[data-testid="toggle-date-filter"]').trigger("click");
    await flushPromises();

    expect(sidebar.props("mapFeatureCollection").features).toHaveLength(1);
    wrapper.unmount();
  });

  it("selects a feature and fetches full record on click", async () => {
    const wrapper = mount(MapView, {
      props: baseProps,
      global: {
        ...globalConfig,
        stubs: {
          ...globalConfig.stubs,
          ViewSidebar: {
            props: ["showSidebar", "feature", "featureLoading"],
            template:
              "<div v-if='showSidebar'>Sidebar {{ feature?._id }}</div>",
          },
        },
      },
    });

    mapboxMock.fireLoad();
    await flushPromises();
    mapboxMock.mockMap.getSource.mockReturnValue(true);

    // Simulate click on Point layer
    mapboxMock.fireClick("data-layer-point", {
      features: [
        {
          type: "Feature",
          geometry: { type: "Point", coordinates: [0, 0] },
          properties: {
            _id: "1",
            status: "active",
            "filter-color": "#ff0000",
          },
        },
      ],
    });
    await flushPromises();

    const vm = wrapper.vm as unknown as {
      showSidebar: boolean;
      selectedFeature: Record<string, unknown> | undefined;
      selectedFeatureLoading: boolean;
    };
    expect(vm.showSidebar).toBe(true);
    // fetchRecord was called with the table and record ID
    expect(mockFetchRecord).toHaveBeenCalledWith("test_table", "1");
    // Full record is populated from the API response with client-side transforms applied
    expect(vm.selectedFeature?.id).toBe("1");
    expect(vm.selectedFeature?.["filter-color"]).toBeUndefined();
    expect(vm.selectedFeatureLoading).toBe(false);
    expect(mockRouter.replace).toHaveBeenCalledWith({
      query: { featureId: "1" },
    });
    expect(mapboxMock.setFeatureState).toHaveBeenCalledWith(
      { source: "data-source", id: 1 },
      { selected: true },
    );
  });

  it("opens a point from featureId and flies to it", async () => {
    mockRoute.value = {
      params: {},
      query: {
        featureId: "1",
        lat: "-3.12000",
        lng: "-60.02000",
        zoom: "11.50",
      },
    };

    const wrapper = mount(MapView, {
      props: baseProps,
      global: globalConfig,
    });

    expect(mapboxMock.Map).toHaveBeenCalledWith(
      expect.objectContaining({
        center: [10, 10],
        zoom: 10,
      }),
    );

    mapboxMock.fireLoad();
    await flushPromises();

    expect(mockFetchRecord).toHaveBeenCalledWith("test_table", "1");
    expect(mapboxMock.mockMap.flyTo).toHaveBeenCalledWith({
      center: [0, 0],
      zoom: 13,
      maxDuration: 1000,
    });
    const vm = wrapper.vm as unknown as {
      showIntroPanel: boolean;
      selectedFeatureLoading: boolean;
    };
    expect(vm.showIntroPanel).toBe(false);
    expect(vm.selectedFeatureLoading).toBe(false);
  });

  it("fits a polygon from featureId", async () => {
    mockRoute.value = {
      params: {},
      query: { featureId: "2" },
    };

    mount(MapView, {
      props: baseProps,
      global: globalConfig,
    });
    mapboxMock.fireLoad();
    await flushPromises();

    expect(mapboxMock.mockMap.fitBounds).toHaveBeenCalledWith(
      expect.any(Array),
      expect.objectContaining({ padding: 50, maxDuration: 1000 }),
    );
    expect(mapboxMock.mockMap.flyTo).not.toHaveBeenCalled();
  });

  it("flies to the centroid of a line from featureId", async () => {
    mockRoute.value = {
      params: {},
      query: { featureId: "line-1" },
    };

    mount(MapView, {
      props: {
        ...baseProps,
        mapData: makeFeatureCollection([
          {
            id: 3,
            type: "LineString",
            coordinates: [
              [0, 0],
              [2, 0],
            ],
            properties: { _id: "line-1" },
          },
        ]),
      },
      global: globalConfig,
    });
    mapboxMock.fireLoad();
    await flushPromises();

    const flyTo = mapboxMock.mockMap.flyTo.mock.calls[0]?.[0] as {
      center: [number, number];
      zoom: number;
      maxDuration: number;
    };
    expect(flyTo.zoom).toBe(13);
    expect(flyTo.maxDuration).toBe(1000);
    expect(flyTo.center[0]).toBeCloseTo(1, 5);
    expect(flyTo.center[1]).toBeCloseTo(0, 5);
  });

  it("leaves the intro panel when featureId is unknown", async () => {
    mockRoute.value = {
      params: {},
      query: { featureId: "missing" },
    };

    const wrapper = mount(MapView, {
      props: baseProps,
      global: globalConfig,
    });
    mapboxMock.fireLoad();
    await flushPromises();

    const vm = wrapper.vm as unknown as {
      showIntroPanel: boolean;
      selectedFeatureLoading: boolean;
    };
    expect(mockFetchRecord).not.toHaveBeenCalled();
    expect(mapboxMock.mockMap.flyTo).not.toHaveBeenCalled();
    expect(vm.showIntroPanel).toBe(true);
    expect(vm.selectedFeatureLoading).toBe(false);
  });

  it.each(["handleSidebarClose", "resetToInitialState"] as const)(
    "keeps secondary selection cleared after %s and a late camera event",
    async (action) => {
      mockRoute.value.query = { secondaryDocId: "1" };
      const wrapper = mount(MapView, {
        props: {
          ...baseProps,
          secondaryData: secondaryGeometry,
          secondaryDataset: "mapping",
        },
        global: globalConfig,
      });
      mapboxMock.fireLoad();
      await flushPromises();
      const vm = wrapper.vm as unknown as Record<typeof action, () => void>;
      vm[action]();
      // The router mock leaves the previous query in place, reproducing a pending replace.
      mapboxMock.fireMapEvent("moveend");
      expect(mockRouter.replace).toHaveBeenLastCalledWith({
        query: {
          featureId: undefined,
          secondaryDocId: undefined,
          lat: "10.00000",
          lng: "10.00000",
          zoom: "10.00",
        },
      });
      mapboxMock.fireClick("secondary-data", {
        features: [secondaryGeometry.features[0]],
      });
      await flushPromises();
      mapboxMock.fireMapEvent("moveend");
      expect(mockRouter.replace).toHaveBeenLastCalledWith({
        query: {
          secondaryDocId: "1",
          lat: "10.00000",
          lng: "10.00000",
          zoom: "10.00",
        },
      });
      wrapper.unmount();
    },
  );

  it("closes sidebar and resets selection", async () => {
    const wrapper = mount(MapView, {
      props: baseProps,
      global: globalConfig,
    });

    mapboxMock.fireLoad();
    await flushPromises();
    mapboxMock.mockMap.getSource.mockReturnValue(true);
    mapboxMock.fireClick("data-layer-point", {
      features: [
        {
          type: "Feature",
          geometry: { type: "Point", coordinates: [0, 0] },
          properties: { _id: "1" },
        },
      ],
    });
    await flushPromises();

    // Call the close handler directly
    const vm = wrapper.vm as unknown as {
      showSidebar: boolean;
      selectedFeature: undefined | Record<string, unknown>;
      showIntroPanel: boolean;
      handleSidebarClose: () => void;
    };

    mockRoute.value.query = { featureId: "1", lat: "-3.12000" };
    vm.handleSidebarClose();
    await flushPromises();

    expect(vm.showSidebar).toBe(false);
    expect(vm.selectedFeature).toBeUndefined();
    expect(vm.showIntroPanel).toBe(true);
    expect(mockRouter.replace).toHaveBeenCalledWith({
      query: { lat: "-3.12000" },
    });
    expect(mapboxMock.setFeatureState).toHaveBeenCalledWith(
      { source: "data-source", id: 1 },
      { selected: false },
    );
  });

  it("shows reset button when sidebar is closed", async () => {
    const wrapper = mount(MapView, {
      props: baseProps,
      global: globalConfig,
    });

    mapboxMock.fireLoad();
    await flushPromises();

    // Initially sidebar is shown, button should not exist
    expect(wrapper.find(".reset-button").exists()).toBe(false);

    // Close sidebar
    const sidebar = wrapper.findComponent({ name: "ViewSidebar" });
    await sidebar.vm.$emit("close");
    await flushPromises();

    // Now reset button should be visible
    expect(wrapper.find(".reset-button").exists()).toBe(true);
  });

  it("resets to initial state when reset button is clicked", async () => {
    const wrapper = mount(MapView, {
      props: baseProps,
      global: globalConfig,
    });

    mapboxMock.fireLoad();
    await flushPromises();

    // Close sidebar to show reset button
    const sidebar = wrapper.findComponent({ name: "ViewSidebar" });
    await sidebar.vm.$emit("close");
    await flushPromises();
    mockRouter.replace.mockClear();
    mockRoute.value.query = { featureId: "1", lat: "-3.12000" };

    // Click reset button
    await wrapper.find(".reset-button").trigger("click");
    await flushPromises();

    const vm = wrapper.vm as unknown as {
      selectedFeature: undefined | Record<string, unknown>;
      showSidebar: boolean;
      showIntroPanel: boolean;
    };
    expect(vm.selectedFeature).toBeUndefined();
    expect(vm.showSidebar).toBe(true);
    expect(vm.showIntroPanel).toBe(true);
    expect(mapboxMock.mockMap.flyTo).toHaveBeenCalledWith({
      center: [10, 10],
      zoom: 10,
      pitch: 0,
      bearing: 0,
    });
    expect(mockRouter.replace).toHaveBeenCalledWith({
      query: { lat: "-3.12000" },
    });
  });

  it("changes basemap when basemap is selected", async () => {
    const wrapper = mount(MapView, {
      props: baseProps,
      global: globalConfig,
    });

    mapboxMock.fireLoad();
    await flushPromises();

    const vm = wrapper.vm as unknown as {
      currentBasemap: { id: string; style: string; access_token?: string };
      handleBasemapChange: (basemap: {
        id: string;
        style: string;
        access_token?: string;
      }) => void;
    };

    vm.handleBasemapChange({
      id: "satellite",
      style: "mapbox://styles/mapbox/satellite-v9",
      access_token: "pk.other",
    });
    await flushPromises();

    expect(vm.currentBasemap.id).toBe("satellite");
    expect(vm.currentBasemap.style).toBe("mapbox://styles/mapbox/satellite-v9");
    expect(vm.currentBasemap.access_token).toBe("pk.other");
    expect(mapboxMock.getAccessToken()).toBe("pk.other");
  });

  it("shows BasemapSelector when multiple basemaps or Planet is available", async () => {
    const singleBasemap = [
      {
        name: "Streets",
        style: "mapbox://styles/mapbox/streets-v12",
        access_token: "pk.test",
        isDefault: true,
      },
    ];
    const multipleBasemaps = [
      ...singleBasemap,
      {
        name: "Satellite",
        style: "mapbox://styles/mapbox/satellite-v9",
        access_token: "pk.test",
        isDefault: false,
      },
    ];

    const wrapper = mount(MapView, {
      props: {
        ...baseProps,
        mapboxBasemaps: singleBasemap,
        planetApiKey: "",
      },
      global: globalConfig,
    });

    mapboxMock.fireLoad();
    await flushPromises();

    expect(wrapper.findComponent({ name: "BasemapSelector" }).exists()).toBe(
      false,
    );

    await wrapper.setProps({ mapboxBasemaps: multipleBasemaps });
    await flushPromises();
    expect(wrapper.findComponent({ name: "BasemapSelector" }).exists()).toBe(
      true,
    );

    await wrapper.setProps({
      mapboxBasemaps: singleBasemap,
      planetApiKey: "planet-key",
    });
    await flushPromises();
    expect(wrapper.findComponent({ name: "BasemapSelector" }).exists()).toBe(
      true,
    );
  });

  it("removes map on component unmount", async () => {
    const wrapper = mount(MapView, {
      props: baseProps,
      global: globalConfig,
    });

    mapboxMock.fireLoad();
    await flushPromises();

    wrapper.unmount();

    expect(mapboxMock.mockMap.remove).toHaveBeenCalled();
  });

  it("uses colorColumn for feature colors when specified", async () => {
    const propsWithColorColumn = {
      ...baseProps,
      colorColumn: "color",
      mapData: makeFeatureCollection([
        {
          id: 1,
          type: "Point",
          coordinates: [0, 0],
          properties: {
            _id: "1",
            status: "active",
            color: "#B209B2",
            "filter-color": "#ff0000",
          },
        },
      ]),
    };

    mount(MapView, {
      props: propsWithColorColumn,
      global: globalConfig,
    });

    mapboxMock.fireLoad();
    await flushPromises();

    // Verify addLayer was called with colorColumn expression
    expect(mapboxMock.mockMap.addLayer).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "data-layer-point",
        paint: expect.objectContaining({
          "circle-color": expect.arrayContaining(["coalesce"]),
        }),
      }),
    );
  });

  it("falls back to filter-color when colorColumn is not set", async () => {
    const propsWithoutColorColumn = {
      ...baseProps,
      colorColumn: undefined,
      mapData: makeFeatureCollection([
        {
          id: 1,
          type: "Point",
          coordinates: [0, 0],
          properties: {
            _id: "1",
            status: "active",
            "filter-color": "#ff0000",
          },
        },
      ]),
    };

    mount(MapView, {
      props: propsWithoutColorColumn,
      global: globalConfig,
    });

    mapboxMock.fireLoad();
    await flushPromises();

    // Verify addLayer was called with filter-color expression
    expect(mapboxMock.mockMap.addLayer).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "data-layer-point",
        paint: expect.objectContaining({
          "circle-color": ["coalesce", ["get", "filter-color"], "#3333FF"],
        }),
      }),
    );
  });

  it("passes colorColumn to DataFilter component", async () => {
    const propsWithColorColumn = {
      ...baseProps,
      colorColumn: "color",
    };

    const wrapper = mount(MapView, {
      props: propsWithColorColumn,
      global: {
        ...globalConfig,
        stubs: {
          ...globalConfig.stubs,
          DataFilter: false,
        },
      },
    });

    mapboxMock.fireLoad();
    await flushPromises();

    await wrapper.get('[data-testid="toggle-data-filter"]').trigger("click");
    const dataFilter = wrapper.findComponent({ name: "DataFilter" });
    expect(dataFilter.exists()).toBe(true);
    expect(dataFilter.props("colorColumn")).toBe("color");
  });

  it("enables icon toggle when iconColumn and mediaBasePathIcons are provided", async () => {
    const propsWithIcons = {
      ...baseProps,
      iconColumn: "icon",
      mediaBasePathIcons: "https://example.com/icons",
    };

    const wrapper = mount(MapView, {
      props: propsWithIcons,
      global: globalConfig,
    });

    mapboxMock.fireLoad();
    await flushPromises();

    const vm = wrapper.vm as unknown as {
      canToggleIcons: boolean;
    };
    expect(vm.canToggleIcons).toBe(true);
  });

  it("disables icon toggle when iconColumn is missing", async () => {
    const propsWithoutIconColumn = {
      ...baseProps,
      mediaBasePathIcons: "https://example.com/icons",
    };

    const wrapper = mount(MapView, {
      props: propsWithoutIconColumn,
      global: globalConfig,
    });

    mapboxMock.fireLoad();
    await flushPromises();

    const vm = wrapper.vm as unknown as {
      canToggleIcons: boolean;
    };
    expect(vm.canToggleIcons).toBe(false);
  });

  it("disables icon toggle when mediaBasePathIcons is missing", async () => {
    const propsWithoutMediaPath = {
      ...baseProps,
      iconColumn: "icon",
    };

    const wrapper = mount(MapView, {
      props: propsWithoutMediaPath,
      global: globalConfig,
    });

    mapboxMock.fireLoad();
    await flushPromises();

    const vm = wrapper.vm as unknown as {
      canToggleIcons: boolean;
    };
    expect(vm.canToggleIcons).toBe(false);
  });

  it("uses showIcons state to determine layer type", async () => {
    const propsWithIcons = {
      ...baseProps,
      iconColumn: "icon",
      mediaBasePathIcons: "https://example.com/icons",
      mapData: makeFeatureCollection([
        {
          id: 1,
          type: "Point",
          coordinates: [0, 0],
          properties: {
            _id: "1",
            status: "active",
            icon: "camp.png",
            "filter-color": "#ff0000",
          },
        },
      ]),
    };

    const wrapper = mount(MapView, {
      props: propsWithIcons,
      global: globalConfig,
    });

    // Verify that toggle is available and starts as false
    const vm = wrapper.vm as unknown as {
      showIcons: boolean;
      canToggleIcons: boolean;
    };

    expect(vm.canToggleIcons).toBe(true);
    expect(vm.showIcons).toBe(false);

    mapboxMock.fireLoad();
    await flushPromises();

    // Check that addLayer was called with circle type (default)
    const addLayerCalls = mapboxMock.mockMap.addLayer.mock.calls;
    const circleLayer = addLayerCalls.find(
      (call: unknown[]) =>
        (call[0] as Record<string, unknown>).id === "data-layer-point" &&
        (call[0] as Record<string, unknown>).type === "circle",
    );
    expect(circleLayer).toBeDefined();
  });

  it("adds circle layer when icons are disabled", async () => {
    const propsWithIcons = {
      ...baseProps,
      iconColumn: "icon",
      mediaBasePathIcons: "https://example.com/icons",
    };

    mount(MapView, {
      props: propsWithIcons,
      global: globalConfig,
    });

    mapboxMock.fireLoad();
    await flushPromises();

    // Check that addLayer was called with circle type (default)
    const addLayerCalls = mapboxMock.mockMap.addLayer.mock.calls;
    const circleLayer = addLayerCalls.find(
      (call: unknown[]) =>
        (call[0] as Record<string, unknown>).id === "data-layer-point" &&
        (call[0] as Record<string, unknown>).type === "circle",
    );
    expect(circleLayer).toBeDefined();
  });

  it("toggles showIcons state when handleToggleIcons is called", async () => {
    const propsWithIcons = {
      ...baseProps,
      iconColumn: "icon",
      mediaBasePathIcons: "https://example.com/icons",
    };

    const wrapper = mount(MapView, {
      props: propsWithIcons,
      global: globalConfig,
    });

    mapboxMock.fireLoad();
    await flushPromises();

    const vm = wrapper.vm as unknown as {
      showIcons: boolean;
    };

    expect(vm.showIcons).toBe(false);

    // Toggle the state directly (simulating the toggle function)
    vm.showIcons = !vm.showIcons;
    await flushPromises();

    expect(vm.showIcons).toBe(true);

    // Toggle back
    vm.showIcons = !vm.showIcons;
    await flushPromises();

    expect(vm.showIcons).toBe(false);
  });

  it("passes icon props to ViewSidebar", async () => {
    const propsWithIcons = {
      ...baseProps,
      iconColumn: "icon",
      mediaBasePathIcons: "https://example.com/icons",
    };

    const wrapper = mount(MapView, {
      props: propsWithIcons,
      global: globalConfig,
    });

    mapboxMock.fireLoad();
    await flushPromises();

    const sidebar = wrapper.findComponent({ name: "ViewSidebar" });
    expect(sidebar.exists()).toBe(true);
    expect(sidebar.props("canToggleIcons")).toBe(true);
    expect(sidebar.props("showIcons")).toBe(false);
  });

  it("passes view name and description to ViewSidebar", async () => {
    const wrapper = mount(MapView, {
      props: {
        ...baseProps,
        viewName: "Friendly Map",
        viewDescription: "Places worth exploring.",
        logoUrl: "https://example.com/logo.png",
      },
      global: globalConfig,
    });

    mapboxMock.fireLoad();
    await flushPromises();

    const sidebar = wrapper.findComponent({ name: "ViewSidebar" });
    expect(sidebar.props("viewName")).toBe("Friendly Map");
    expect(sidebar.props("viewDescription")).toBe("Places worth exploring.");
    expect(sidebar.props("tableName")).toBe("test_table");
    expect(sidebar.props("logoUrl")).toBe("https://example.com/logo.png");
  });

  it("handles toggle-icons event from ViewSidebar", async () => {
    const propsWithIcons = {
      ...baseProps,
      iconColumn: "icon",
      mediaBasePathIcons: "https://example.com/icons",
    };

    const wrapper = mount(MapView, {
      props: propsWithIcons,
      global: globalConfig,
    });

    mapboxMock.fireLoad();
    await flushPromises();

    const vm = wrapper.vm as unknown as {
      showIcons: boolean;
    };

    expect(vm.showIcons).toBe(false);

    const sidebar = wrapper.findComponent({ name: "ViewSidebar" });
    await sidebar.vm.$emit("toggle-icons");
    await flushPromises();

    expect(vm.showIcons).toBe(true);
  });
});
