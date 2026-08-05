import { describe, it, expect, vi } from "vitest";
import { mount } from "@vue/test-utils";
import { computed, ref } from "vue";
import MapIntroPanel from "@/components/map/MapIntroPanel.vue";
import type { FeatureCollection } from "geojson";

Object.assign(globalThis, { ref, computed });

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
};

describe("MapIntroPanel", () => {
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
