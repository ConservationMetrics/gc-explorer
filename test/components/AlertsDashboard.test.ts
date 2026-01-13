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

import AlertsDashboard from "@/components/AlertsDashboard.vue";

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
  mapeoData: null,
  mediaBasePath: "",
  mediaBasePathAlerts: "",
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

describe("AlertsDashboard component", () => {
  beforeEach(() => {
    mapboxMock.reset();
    document.body.innerHTML = '<div id="map"></div>';
  });

  it("initialises Mapbox and adds controls", async () => {
    const wrapper = mount(AlertsDashboard, {
      props: baseProps,
      global: {
        stubs: {
          ViewSidebar: true,
          MapLegend: true,
          BasemapSelector: true,
        },
      },
    });

    // Trigger component's onMounted -> map 'load' event
    mapboxMock.fireLoad();
    await flushPromises();

    expect(mapboxMock.Map).toHaveBeenCalledTimes(1);
    expect(mapboxMock.addControl).toHaveBeenCalled();
    expect(wrapper.exists()).toBe(true);
  });

  it("selects an alert feature and opens sidebar", async () => {
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
        stubs: {
          ViewSidebar: {
            props: ["showSidebar", "feature"],
            template:
              "<div v-if='showSidebar'>Sidebar {{ feature?.alertID }}</div>",
          },
          MapLegend: true,
          BasemapSelector: true,
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

  it("adds 3D terrain when mapbox3d is true", async () => {
    const propsWithTerrain = { ...baseProps, mapbox3d: true };

    mount(AlertsDashboard, {
      props: propsWithTerrain,
      global: {
        stubs: {
          ViewSidebar: true,
          MapLegend: true,
          BasemapSelector: true,
        },
      },
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
      mapbox3dTerrainExaggeration: 3.0,
    };

    mount(AlertsDashboard, {
      props: propsWithCustomExaggeration,
      global: {
        stubs: {
          ViewSidebar: true,
          MapLegend: true,
          BasemapSelector: true,
        },
      },
    });

    mapboxMock.fireLoad();
    await flushPromises();

    expect(mapboxMock.mockMap.setTerrain).toHaveBeenCalledWith({
      source: "mapbox-dem",
      exaggeration: 3.0,
    });
  });

  describe("Incidents functionality", () => {
    it("renders incidents controls", async () => {
      const wrapper = mount(AlertsDashboard, {
        props: baseProps,
        global: {
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

    it("toggles incidents sidebar when view incidents button is clicked", async () => {
      const wrapper = mount(AlertsDashboard, {
        props: baseProps,
        global: {
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

      const viewIncidentsButton = wrapper
        .find(".incidents-controls")
        .findAll("button")[0];
      await viewIncidentsButton.trigger("click");
      await flushPromises();

      const sidebar = wrapper.find(".incidents-sidebar");
      expect(sidebar.exists()).toBe(true);
    });

    it("toggles multi-select mode", async () => {
      const wrapper = mount(AlertsDashboard, {
        props: baseProps,
        global: {
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

      const multiSelectButton = wrapper
        .find(".incidents-controls")
        .findAll("button")[1];

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

      const boundingBoxButton = wrapper
        .find(".incidents-controls")
        .findAll("button")[2];

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
        }>;
      };
      vm.selectedSources = [{ source_table: "mapeo_data", source_id: "test1" }];
      await flushPromises();

      const createButton = wrapper
        .find(".incidents-controls")
        .findAll("button")[3]; // Create button is the last one

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

      const createButton = wrapper
        .find(".incidents-controls")
        .findAll("button")[3];

      // Button should be disabled when no sources are selected
      expect(createButton.attributes("disabled")).toBeDefined();
    });

    it("disables multi-select when bounding box is enabled", async () => {
      const wrapper = mount(AlertsDashboard, {
        props: baseProps,
        global: {
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

      const multiSelectButton = wrapper
        .find(".incidents-controls")
        .findAll("button")[1];
      const boundingBoxButton = wrapper
        .find(".incidents-controls")
        .findAll("button")[2];

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

      const multiSelectButton = wrapper
        .find(".incidents-controls")
        .findAll("button")[1];
      const boundingBoxButton = wrapper
        .find(".incidents-controls")
        .findAll("button")[2];

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
  });
});
