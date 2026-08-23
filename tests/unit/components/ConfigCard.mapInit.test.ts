import { describe, expect, it, vi } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";
import { computed, nextTick, onMounted, reactive, ref, watch } from "vue";

import ConfigCard from "@/components/config/ConfigCard.vue";
import ConfigMap from "@/components/config/ConfigMap.vue";
import type { ViewConfig } from "@/types";

Object.assign(globalThis, {
  computed,
  nextTick,
  onMounted,
  reactive,
  ref,
  watch,
});

vi.mock("@vojtechlanka/vue-tags-input", () => ({
  VueTagsInput: {
    template: "<div />",
  },
}));

vi.mock("vue-3-slider-component", () => ({
  default: {
    template: "<div />",
  },
}));

vi.mock("@/composables/useTags", () => ({
  updateTags: () => ({
    tags: {},
    handleTagsChanged: vi.fn(),
  }),
}));

const savedMapConfig = {
  MAPBOX_ACCESS_TOKEN: "pk.ey.test-token",
  MAPBOX_ZOOM: 11,
  MAPBOX_CENTER_LATITUDE: -9.24,
  MAPBOX_CENTER_LONGITUDE: 160.98377,
  MAPBOX_PROJECTION: "mercator",
  ROUTE_LEVEL_PERMISSION: "member",
} as ViewConfig;

const mountConfigCard = () =>
  mount(ConfigCard, {
    props: {
      tableName: "test_map",
      viewType: "map",
      viewConfig: savedMapConfig,
      configToCopy: null,
    },
    global: {
      components: {
        ConfigMap,
      },
      stubs: {
        "i18n-t": {
          template: "<span><slot></slot><slot name='link'></slot></span>",
        },
        BasemapSelector: true,
        ConfigViewInfo: {
          props: ["keys"],
          template:
            '<div data-testid="config-view-info" :data-keys="keys.join(\',\')" />',
        },
        ConfigFilters: true,
        ConfigMedia: true,
        ConfigPermissions: {
          template: "<div />",
          emits: ["updateConfig", "updateValidation"],
        },
        ConfigViews: true,
        ConfigCollapsibleSection: {
          props: ["title"],
          template:
            '<section data-testid="config-section" :data-title="title"><slot /></section>',
        },
      },
      mocks: {
        $t: (key: string) => key,
      },
    },
  });

describe("ConfigCard map initialization", () => {
  it("puts View before the other configuration sections", () => {
    const wrapper = mountConfigCard();

    expect(
      wrapper
        .findAll("[data-testid='config-section']")
        .map((section) => section.attributes("data-title")),
    ).toEqual(["view", "map", "media", "filtering", "visibility"]);
  });

  it("orders View fields by display name, description, header, and logo", () => {
    const wrapper = mountConfigCard();

    expect(
      wrapper.get("[data-testid='config-view-info']").attributes("data-keys"),
    ).toBe("DATASET_TABLE,VIEW_DESCRIPTION,VIEW_HEADER_IMAGE,LOGO_URL");
  });

  it("keeps saved numeric fields visible after changing projection", async () => {
    const wrapper = mountConfigCard();

    await flushPromises();
    await nextTick();

    const zoomInput = wrapper.find<HTMLInputElement>(
      'input[id="test_map-MAPBOX_ZOOM"]',
    );
    const latitudeInput = wrapper.find<HTMLInputElement>(
      'input[id="test_map-MAPBOX_CENTER_LATITUDE"]',
    );
    const longitudeInput = wrapper.find<HTMLInputElement>(
      'input[id="test_map-MAPBOX_CENTER_LONGITUDE"]',
    );
    const projectionSelect = wrapper.find<HTMLSelectElement>(
      'select[id="test_map-MAPBOX_PROJECTION"]',
    );

    expect(zoomInput.element.value).toBe("11");
    expect(latitudeInput.element.value).toBe("-9.24");
    expect(longitudeInput.element.value).toBe("160.98377");

    await projectionSelect.setValue("globe");
    await nextTick();

    expect(zoomInput.element.value).toBe("11");
    expect(latitudeInput.element.value).toBe("-9.24");
    expect(longitudeInput.element.value).toBe("160.98377");
  });
});
