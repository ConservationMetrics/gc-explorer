import { describe, it, expect, vi, beforeEach } from "vitest";
import { mount } from "@vue/test-utils";
import { computed, ref } from "vue";
import MapIntroPanel from "@/components/map/MapIntroPanel.vue";
import type { FeatureCollection } from "geojson";

Object.assign(globalThis, { ref, computed });

const canManageConfig = ref(true);
vi.mock("@/composables/useCanManageConfig", () => ({
  useCanManageConfig: () => canManageConfig,
}));

vi.mock("@/components/shared/DownloadMapData.vue", () => ({
  default: { name: "DownloadMapData", template: "<div />" },
}));

const emptyCollection: FeatureCollection = {
  type: "FeatureCollection",
  features: [],
};

const globalConfig = {
  mocks: {
    $t: (key: string) => key,
    $n: (n: number) => String(n),
  },
  stubs: {
    AdminConfigGear: {
      props: ["tableName", "viewType"],
      template:
        '<a data-testid="admin-config-gear" :data-table-name="tableName" :data-view-type="viewType" />',
    },
  },
};

describe("MapIntroPanel", () => {
  beforeEach(() => {
    canManageConfig.value = true;
  });

  it("shows viewName when provided", () => {
    const wrapper = mount(MapIntroPanel, {
      props: {
        mapStatistics: { totalFeatures: 2 },
        mapFeatureCollection: emptyCollection,
        viewName: "Friendly Map",
        tableName: "raw_table",
        viewDescription: "Places worth exploring.",
      },
      global: globalConfig,
    });

    expect(wrapper.find('[data-testid="map-intro-title"]').text()).toBe(
      "Friendly Map",
    );
    expect(wrapper.find('[data-testid="map-intro-description"]').text()).toBe(
      "Places worth exploring.",
    );
    const gear = wrapper.get('[data-testid="admin-config-gear"]');
    expect(gear.attributes("data-table-name")).toBe("raw_table");
    expect(gear.attributes("data-view-type")).toBe("map");
  });

  it("does not show the config gear when the user is not an admin", () => {
    canManageConfig.value = false;
    const wrapper = mount(MapIntroPanel, {
      props: {
        mapStatistics: { totalFeatures: 2 },
        mapFeatureCollection: emptyCollection,
        viewName: "Friendly Map",
        tableName: "raw_table",
      },
      global: {
        ...globalConfig,
        stubs: {
          ...globalConfig.stubs,
          AdminConfigGear: false,
          NuxtLink: { template: "<a><slot /></a>" },
        },
      },
    });

    expect(wrapper.find('[data-testid="admin-config-gear"]').exists()).toBe(
      false,
    );
  });

  it("falls back to tableName when viewName is missing", () => {
    const wrapper = mount(MapIntroPanel, {
      props: {
        mapStatistics: { totalFeatures: 1 },
        mapFeatureCollection: emptyCollection,
        tableName: "raw_table",
      },
      global: globalConfig,
    });

    expect(wrapper.find('[data-testid="map-intro-title"]').text()).toBe(
      "raw_table",
    );
    expect(wrapper.find('[data-testid="map-intro-description"]').exists()).toBe(
      false,
    );
  });
});
