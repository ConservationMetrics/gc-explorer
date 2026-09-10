import { describe, expect, it, vi } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";
import { computed, nextTick, onMounted, reactive, ref, watch } from "vue";

import ConfigCard from "@/components/config/ConfigCard.vue";
import ConfigMap from "@/components/config/ConfigMap.vue";
import type { ColumnEntry, ViewConfig } from "@/types";

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

const validBasemap = {
  name: "Satellite Streets",
  style: "mapbox://styles/mapbox/satellite-streets-v12",
  access_token: "pk.ey.test-token",
  isDefault: true,
};

const savedMapConfig = {
  MAPBOX_BASEMAPS: JSON.stringify([validBasemap]),
  MAPBOX_ZOOM: 11,
  MAPBOX_CENTER_LATITUDE: -9.24,
  MAPBOX_CENTER_LONGITUDE: 160.98377,
  MAPBOX_PROJECTION: "mercator",
  ROUTE_LEVEL_PERMISSION: "member",
} as ViewConfig;

const mountConfigCard = (
  viewConfig: ViewConfig = savedMapConfig,
  primaryColumns: ColumnEntry[] = [],
) =>
  mount(ConfigCard, {
    props: {
      tableName: "test_map",
      viewType: "map",
      viewConfig,
      configToCopy: null,
      primaryColumns,
    },
    global: {
      components: {
        ConfigMap,
      },
      stubs: {
        ConfigMapPreview: true,
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

  it("preserves view identity fields when applying a copied config", async () => {
    const wrapper = mountConfigCard();
    const cardVm = wrapper.vm as unknown as { localConfig: ViewConfig };
    cardVm.localConfig.DATASET_TABLE = "My Map";
    cardVm.localConfig.VIEW_DESCRIPTION = "Mine";
    cardVm.localConfig.VIEW_HEADER_IMAGE = "https://example.test/header.jpg";
    cardVm.localConfig.LOGO_URL = "https://example.test/logo.png";
    await nextTick();

    await wrapper.setProps({
      configToCopy: { MAPBOX_ZOOM: 3, MAPBOX_PROJECTION: "globe" },
    });
    await nextTick();

    expect(cardVm.localConfig.DATASET_TABLE).toBe("My Map");
    expect(cardVm.localConfig.VIEW_DESCRIPTION).toBe("Mine");
    expect(cardVm.localConfig.VIEW_HEADER_IMAGE).toBe(
      "https://example.test/header.jpg",
    );
    expect(cardVm.localConfig.LOGO_URL).toBe("https://example.test/logo.png");
    expect(cardVm.localConfig.MAPBOX_ZOOM).toBe(3);
    expect(cardVm.localConfig.MAPBOX_PROJECTION).toBe("globe");
  });

  it("treats a blank basemap access token as invalid map config", async () => {
    const wrapper = mountConfigCard();
    await flushPromises();
    await nextTick();

    const cardVm = wrapper.vm as unknown as { isFormValid: boolean };
    expect(cardVm.isFormValid).toBe(true);

    const tokenInput = wrapper.find<HTMLInputElement>(
      'input[id="test_map-basemap-access-token-0"]',
    );
    await tokenInput.setValue("   ");
    await nextTick();

    expect(cardVm.isFormValid).toBe(false);
  });

  it.each([
    ["name", { ...validBasemap, name: "" }],
    ["style", { ...validBasemap, style: "invalid-style" }],
    ["access token", { ...validBasemap, access_token: "invalid-token" }],
  ])("rejects an invalid basemap %s", async (_field, basemap) => {
    const wrapper = mountConfigCard({
      ...savedMapConfig,
      MAPBOX_BASEMAPS: JSON.stringify([basemap]),
    });
    await flushPromises();
    await nextTick();

    const cardVm = wrapper.vm as unknown as { isFormValid: boolean };
    expect(cardVm.isFormValid).toBe(false);
  });

  it("accepts an inline Mapbox style object as valid map config", async () => {
    const wrapper = mountConfigCard({
      ...savedMapConfig,
      MAPBOX_BASEMAPS: JSON.stringify([
        {
          ...validBasemap,
          style: { version: 8, sources: {}, layers: [] },
        },
      ]),
    });
    await flushPromises();
    await nextTick();

    const cardVm = wrapper.vm as unknown as { isFormValid: boolean };
    expect(cardVm.isFormValid).toBe(true);
  });

  it("enables save after a matching access token is entered", async () => {
    const wrapper = mountConfigCard({
      ...savedMapConfig,
      MAPBOX_BASEMAPS: JSON.stringify([{ ...validBasemap, access_token: "" }]),
    });
    await flushPromises();
    await nextTick();

    const submitButton = wrapper.get<HTMLButtonElement>(
      '[data-testid="config-submit-button"]',
    );
    expect(submitButton.element.disabled).toBe(true);

    const tokenInput = wrapper.find<HTMLInputElement>(
      'input[id="test_map-basemap-access-token-0"]',
    );
    await tokenInput.setValue("pk.eyFixedToken");
    await nextTick();

    expect(submitButton.element.disabled).toBe(false);
  });

  it("enables save after a token is entered when saved filter columns are unavailable", async () => {
    const wrapper = mountConfigCard(
      {
        ...savedMapConfig,
        MAPBOX_BASEMAPS: JSON.stringify([
          { ...validBasemap, access_token: "" },
        ]),
        FRONT_END_FILTER_COLUMN: "missing_filter",
        TIMESTAMP_COLUMN: "missing_timestamp",
      },
      [
        {
          original_column: "status",
          sql_column: "status",
        },
      ],
    );
    await flushPromises();
    await nextTick();

    const tokenInput = wrapper.find<HTMLInputElement>(
      'input[id="test_map-basemap-access-token-0"]',
    );
    await tokenInput.setValue("pk.eyFixedToken");
    await nextTick();

    expect(
      wrapper.get<HTMLButtonElement>('[data-testid="config-submit-button"]')
        .element.disabled,
    ).toBe(false);
  });

  it("enables save after a token is entered when dataset columns have not loaded", async () => {
    const wrapper = mountConfigCard({
      ...savedMapConfig,
      MAPBOX_BASEMAPS: JSON.stringify([{ ...validBasemap, access_token: "" }]),
      COLOR_COLUMN: "color",
      MEDIA_COLUMN: "photos",
    });
    await flushPromises();
    await nextTick();

    const tokenInput = wrapper.find<HTMLInputElement>(
      'input[id="test_map-basemap-access-token-0"]',
    );
    await tokenInput.setValue("pk.eyFixedToken");
    await nextTick();

    expect(
      wrapper.get<HTMLButtonElement>('[data-testid="config-submit-button"]')
        .element.disabled,
    ).toBe(false);
  });

  it("enables save after a token is entered when projection is unset", async () => {
    const configWithoutProjection = { ...savedMapConfig };
    delete configWithoutProjection.MAPBOX_PROJECTION;
    const wrapper = mountConfigCard({
      ...configWithoutProjection,
      MAPBOX_BASEMAPS: JSON.stringify([{ ...validBasemap, access_token: "" }]),
    });
    await flushPromises();
    await nextTick();

    const tokenInput = wrapper.find<HTMLInputElement>(
      'input[id="test_map-basemap-access-token-0"]',
    );
    await tokenInput.setValue("pk.eyFixedToken");
    await nextTick();

    expect(
      wrapper.get<HTMLButtonElement>('[data-testid="config-submit-button"]')
        .element.disabled,
    ).toBe(false);
    expect(
      wrapper.get<HTMLSelectElement>('select[id="test_map-MAPBOX_PROJECTION"]')
        .element.required,
    ).toBe(false);
    expect(wrapper.get<HTMLFormElement>("form").element.checkValidity()).toBe(
      true,
    );
  });

  it("removes stale unavailable columns when saving another change", async () => {
    const wrapper = mountConfigCard(
      {
        ...savedMapConfig,
        COLOR_COLUMN: "color",
        ICON_COLUMN: "icon",
      },
      [
        {
          original_column: "_submission_time",
          sql_column: "_submission_time",
        },
      ],
    );
    const cardVm = wrapper.vm as unknown as { localConfig: ViewConfig };

    cardVm.localConfig.TIMESTAMP_COLUMN = "_submission_time";
    await nextTick();

    const submitButton = wrapper.get<HTMLButtonElement>(
      '[data-testid="config-submit-button"]',
    );
    expect(submitButton.element.disabled).toBe(false);

    await wrapper.get("form").trigger("submit");

    const submission = wrapper.emitted("submitConfig")?.[0]?.[0] as {
      config: ViewConfig;
    };
    expect(submission.config.TIMESTAMP_COLUMN).toBe("_submission_time");
    expect(submission.config).not.toHaveProperty("COLOR_COLUMN");
    expect(submission.config).not.toHaveProperty("ICON_COLUMN");
  });

  it("keeps saved columns when no dataset columns are loaded", async () => {
    const wrapper = mountConfigCard({
      ...savedMapConfig,
      COLOR_COLUMN: "color",
      MEDIA_COLUMN: "photos",
    });
    const cardVm = wrapper.vm as unknown as { localConfig: ViewConfig };

    cardVm.localConfig.MAPBOX_ZOOM = 12;
    await nextTick();

    expect(
      wrapper.get<HTMLButtonElement>('[data-testid="config-submit-button"]')
        .element.disabled,
    ).toBe(false);

    await wrapper.get("form").trigger("submit");

    const submission = wrapper.emitted("submitConfig")?.[0]?.[0] as {
      config: ViewConfig;
    };
    expect(submission.config.COLOR_COLUMN).toBe("color");
    expect(submission.config.MEDIA_COLUMN).toBe("photos");
  });

  it("still blocks newly introduced unavailable columns", async () => {
    const wrapper = mountConfigCard(savedMapConfig, [
      {
        original_column: "_submission_time",
        sql_column: "_submission_time",
      },
    ]);
    const cardVm = wrapper.vm as unknown as { localConfig: ViewConfig };

    cardVm.localConfig.COLOR_COLUMN = "not_a_column";
    await nextTick();

    expect(
      wrapper.get<HTMLButtonElement>('[data-testid="config-submit-button"]')
        .element.disabled,
    ).toBe(true);
  });
});
