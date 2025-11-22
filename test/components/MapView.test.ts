import { describe, it, expect, beforeEach, vi } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";
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

import * as mapboxMock from "@/test/helpers/mapboxMock";

import MapView from "@/components/MapView.vue";

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
  mapData: [
    {
      id: "1",
      geotype: "Point",
      geocoordinates: "[0, 0]",
      status: "active",
      "filter-color": "#ff0000",
    },
    {
      id: "2",
      geotype: "Polygon",
      geocoordinates: "[[[0,0],[1,1],[1,0],[0,0]]]",
      status: "inactive",
      "filter-color": "#00ff00",
    },
  ],
  mediaBasePath: "/media",
  planetApiKey: "",
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
  },
  stubs: {
    DataFilter: true,
    ViewSidebar: true,
    MapLegend: true,
    BasemapSelector: true,
  },
};

describe("MapView component", () => {
  beforeEach(() => {
    mapboxMock.reset();
    document.body.innerHTML = '<div id="map"></div>';
  });

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
      filteredData: typeof baseProps.mapData;
      filterValues: (values: string[]) => void;
    };

    vm.filterValues(["active"]);
    await flushPromises();

    expect(vm.filteredData).toHaveLength(1);
    expect(vm.filteredData[0].status).toBe("active");
  });

  it("shows all data when 'null' is in filter values", async () => {
    const wrapper = mount(MapView, {
      props: baseProps,
      global: globalConfig,
    });

    mapboxMock.fireLoad();
    await flushPromises();

    const dataFilter = wrapper.findComponent({ name: "DataFilter" });
    await dataFilter.vm.$emit("filter", ["null"]);
    await flushPromises();

    const vm = wrapper.vm as unknown as {
      filteredData: typeof baseProps.mapData;
    };
    expect(vm.filteredData).toHaveLength(2);
  });

  it("selects a feature and opens sidebar when clicked", async () => {
    const wrapper = mount(MapView, {
      props: baseProps,
      global: {
        ...globalConfig,
        stubs: {
          ...globalConfig.stubs,
          ViewSidebar: {
            props: ["showSidebar", "feature"],
            template: "<div v-if='showSidebar'>Sidebar {{ feature?.id }}</div>",
          },
        },
      },
    });

    mapboxMock.fireLoad();
    await flushPromises();

    // Simulate click on Point layer
    mapboxMock.fireClick("data-layer-point", {
      features: [
        {
          type: "Feature",
          geometry: { type: "Point", coordinates: [0, 0] },
          properties: {
            feature: JSON.stringify({
              id: "1",
              geotype: "Point",
              geocoordinates: "[0, 0]",
              status: "active",
              "filter-color": "#ff0000",
            }),
          },
        },
      ],
    });
    await flushPromises();

    const vm = wrapper.vm as unknown as {
      showSidebar: boolean;
      selectedFeature: Record<string, unknown>;
    };
    expect(vm.showSidebar).toBe(true);
    expect(vm.selectedFeature.id).toBe("1");
    expect(vm.selectedFeature["filter-color"]).toBeUndefined();
  });

  it("closes sidebar and resets selection", async () => {
    const wrapper = mount(MapView, {
      props: baseProps,
      global: globalConfig,
    });

    mapboxMock.fireLoad();
    await flushPromises();

    // Call the close handler directly
    const vm = wrapper.vm as unknown as {
      showSidebar: boolean;
      selectedFeature: null | Record<string, unknown>;
      showIntroPanel: boolean;
      handleSidebarClose: () => void;
    };

    vm.handleSidebarClose();
    await flushPromises();

    expect(vm.showSidebar).toBe(false);
    expect(vm.selectedFeature).toBeNull();
    expect(vm.showIntroPanel).toBe(true);
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

    // Click reset button
    await wrapper.find(".reset-button").trigger("click");
    await flushPromises();

    const vm = wrapper.vm as unknown as {
      selectedFeature: null | Record<string, unknown>;
      showSidebar: boolean;
      showIntroPanel: boolean;
    };
    expect(vm.selectedFeature).toBeNull();
    expect(vm.showSidebar).toBe(true);
    expect(vm.showIntroPanel).toBe(true);
    expect(mapboxMock.mockMap.flyTo).toHaveBeenCalledWith({
      center: [10, 10],
      zoom: 10,
      pitch: 0,
      bearing: 0,
    });
  });

  it("changes basemap when basemap is selected", async () => {
    const wrapper = mount(MapView, {
      props: baseProps,
      global: globalConfig,
    });

    mapboxMock.fireLoad();
    await flushPromises();

    // Call the basemap change handler directly
    const vm = wrapper.vm as unknown as {
      currentBasemap: { id: string; style: string };
      handleBasemapChange: (basemap: { id: string; style: string }) => void;
    };

    vm.handleBasemapChange({
      id: "satellite",
      style: "mapbox://styles/mapbox/satellite-v9",
    });
    await flushPromises();

    expect(vm.currentBasemap.id).toBe("satellite");
    expect(vm.currentBasemap.style).toBe("mapbox://styles/mapbox/satellite-v9");
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
      mapData: [
        {
          id: "1",
          geotype: "Point",
          geocoordinates: "[0, 0]",
          status: "active",
          color: "#B209B2",
          "filter-color": "#ff0000",
        },
      ],
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
      mapData: [
        {
          id: "1",
          geotype: "Point",
          geocoordinates: "[0, 0]",
          status: "active",
          "filter-color": "#ff0000",
        },
      ],
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
          "circle-color": ["get", "filter-color", ["get", "feature"]],
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

    const dataFilter = wrapper.findComponent({ name: "DataFilter" });
    expect(dataFilter.exists()).toBe(true);
    expect(dataFilter.props("colorColumn")).toBe("color");
  });
});
