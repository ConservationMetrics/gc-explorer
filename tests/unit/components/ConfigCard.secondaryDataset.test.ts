import { describe, expect, it } from "vitest";
import { mount } from "@vue/test-utils";
import { computed, nextTick, ref, watch } from "vue";

import ConfigCard from "@/components/config/ConfigCard.vue";
import {
  SECONDARY_DATASET_VIEW_TYPES,
  type ViewConfig,
  type ViewType,
} from "@/types";

Object.assign(globalThis, {
  computed,
  nextTick,
  ref,
  watch,
});

const mountConfigCard = (
  viewType: ViewType,
  viewConfig: ViewConfig = {
    MAPBOX_ACCESS_TOKEN: "pk.ey.test-token",
    MAPBOX_ZOOM: 10,
    MAPBOX_PROJECTION: "mercator",
    MAPBOX_CENTER_LATITUDE: "0",
    MAPBOX_CENTER_LONGITUDE: "0",
    ROUTE_LEVEL_PERMISSION: "member",
  },
) =>
  mount(ConfigCard, {
    props: {
      tableName: "primary_dataset",
      viewType,
      viewConfig,
      secondaryDataset: "old_secondary",
      secondaryEditable: true,
    },
    global: {
      stubs: {
        ConfigCollapsibleSection: {
          template: "<div><slot /></div>",
        },
        ConfigFilters: {
          name: "ConfigFilters",
          props: ["config", "keys"],
          template: "<div />",
        },
        ConfigMap: true,
        ConfigMedia: true,
        ConfigPermissions: {
          template: "<div />",
          emits: ["updateConfig", "updateValidation"],
        },
        ConfigViewInfo: true,
      },
      mocks: {
        $t: (key: string) => key,
      },
    },
  });

describe.each<ViewType>([...SECONDARY_DATASET_VIEW_TYPES])(
  "ConfigCard %s secondary dataset",
  (viewType) => {
    it("submits when only the secondary dataset changes", async () => {
      const wrapper = mountConfigCard(viewType);
      const submitButton = wrapper.get<HTMLButtonElement>(
        '[data-testid="config-submit-button"]',
      );

      expect(submitButton.element.disabled).toBe(true);

      await wrapper.setProps({ secondaryDataset: "new_secondary" });
      await nextTick();

      expect(submitButton.element.disabled).toBe(false);
      await wrapper.get("form").trigger("submit");

      expect(wrapper.emitted("submitConfig")?.[0]?.[0]).toMatchObject({
        tableName: "primary_dataset",
        secondaryDataset: "new_secondary",
      });
    });
  },
);

describe("ConfigCard alerts filter config", () => {
  it("passes the generic filter fields to ConfigFilters", () => {
    const wrapper = mountConfigCard("alerts", {
      MAPBOX_ACCESS_TOKEN: "pk.ey.test-token",
      FRONT_END_FILTER_COLUMN: "status",
      SECONDARY_FILTER_VALUES: "active",
    });

    expect(
      wrapper.getComponent({ name: "ConfigFilters" }).props("config"),
    ).toEqual(
      expect.objectContaining({
        FRONT_END_FILTER_COLUMN: "status",
        SECONDARY_FILTER_VALUES: "active",
      }),
    );
    expect(
      wrapper.getComponent({ name: "ConfigFilters" }).props("keys"),
    ).toEqual(["FRONT_END_FILTER_COLUMN", "SECONDARY_FILTER_VALUES"]);
  });
});
