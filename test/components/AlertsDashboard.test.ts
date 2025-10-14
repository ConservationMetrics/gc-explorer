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
});
