import { describe, expect, it } from "vitest";
import { mount } from "@vue/test-utils";
import { computed, nextTick, ref, watch } from "vue";

import ConfigCard from "@/components/config/ConfigCard.vue";
import type { ViewConfig, ViewType } from "@/types";

Object.assign(globalThis, {
  computed,
  nextTick,
  ref,
  watch,
});

const keysStub = (testId: string) => ({
  props: ["keys"],
  template: `<div data-testid="${testId}" :data-keys="keys.join(',')" />`,
});

const mountConfigCard = (viewType: ViewType) =>
  mount(ConfigCard, {
    props: {
      tableName: "primary_dataset",
      viewType,
      viewConfig: {
        MAPBOX_ACCESS_TOKEN: "pk.ey.test-token",
        ROUTE_LEVEL_PERMISSION: "member",
      } as ViewConfig,
    },
    global: {
      stubs: {
        ConfigCollapsibleSection: {
          template: "<div><slot /></div>",
        },
        ConfigViewInfo: keysStub("config-view-info"),
        ConfigMap: keysStub("config-map"),
        ConfigMedia: keysStub("config-media"),
        ConfigFilters: keysStub("config-filters"),
        ConfigPermissions: {
          template: "<div />",
          emits: ["updateConfig", "updateValidation"],
        },
      },
      mocks: {
        $t: (key: string) => key,
      },
    },
  });

const keysFrom = (wrapper: ReturnType<typeof mount>, testId: string) =>
  wrapper
    .get(`[data-testid='${testId}']`)
    .attributes("data-keys")
    ?.split(",") ?? [];

describe("ConfigCard field visibility by view type", () => {
  it("shows logo, map color/icon, icon media path, and unwanted columns for map", () => {
    const wrapper = mountConfigCard("map");

    expect(keysFrom(wrapper, "config-view-info")).toEqual([
      "DATASET_TABLE",
      "VIEW_DESCRIPTION",
      "VIEW_HEADER_IMAGE",
      "LOGO_URL",
    ]);
    expect(keysFrom(wrapper, "config-map")).toEqual(
      expect.arrayContaining(["COLOR_COLUMN", "ICON_COLUMN", "PLANET_API_KEY"]),
    );
    expect(keysFrom(wrapper, "config-media")).toEqual([
      "MEDIA_BASE_PATH",
      "MEDIA_BASE_PATH_ICONS",
      "MEDIA_COLUMN",
    ]);
    expect(keysFrom(wrapper, "config-filters")).toEqual([
      "FRONT_END_FILTER_COLUMN",
      "TIMESTAMP_COLUMN",
    ]);
  });

  it("shows logo, alerts media path, and secondary filter values for alerts", () => {
    const wrapper = mountConfigCard("alerts");

    expect(keysFrom(wrapper, "config-view-info")).toContain("LOGO_URL");
    expect(keysFrom(wrapper, "config-map")).not.toContain("COLOR_COLUMN");
    expect(keysFrom(wrapper, "config-map")).not.toContain("ICON_COLUMN");
    expect(keysFrom(wrapper, "config-media")).toEqual([
      "MEDIA_BASE_PATH",
      "MEDIA_BASE_PATH_ALERTS",
    ]);
    expect(keysFrom(wrapper, "config-filters")).toEqual([
      "FRONT_END_FILTER_COLUMN",
      "SECONDARY_FILTER_VALUES",
    ]);
  });

  it("hides logo, map section fields, and map-only media for gallery", () => {
    const wrapper = mountConfigCard("gallery");

    expect(keysFrom(wrapper, "config-view-info")).toEqual([
      "DATASET_TABLE",
      "VIEW_DESCRIPTION",
      "VIEW_HEADER_IMAGE",
    ]);
    expect(wrapper.find("[data-testid='config-map']").exists()).toBe(false);
    expect(keysFrom(wrapper, "config-media")).toEqual([
      "MEDIA_BASE_PATH",
      "MEDIA_COLUMN",
    ]);
    expect(keysFrom(wrapper, "config-filters")).toEqual([
      "FRONT_END_FILTER_COLUMN",
      "TIMESTAMP_COLUMN",
    ]);
  });
});
