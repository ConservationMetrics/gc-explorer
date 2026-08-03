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

const mountConfigCard = (
  viewType: ViewType,
  viewConfig: ViewConfig = {
    MAPBOX_ACCESS_TOKEN: "pk.ey.test-token",
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

describe.each<ViewType>(["alerts", "map"])(
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

describe("ConfigCard alerts filter migration", () => {
  it("maps legacy category values to generic filter config", () => {
    const wrapper = mountConfigCard("alerts", {
      MAPBOX_ACCESS_TOKEN: "pk.ey.test-token",
      MAPEO_CATEGORY_IDS: "threat",
    });

    expect(
      wrapper.getComponent({ name: "ConfigFilters" }).props("config"),
    ).toEqual(
      expect.objectContaining({
        FRONT_END_FILTER_COLUMN: "p__categoryid",
        SECONDARY_FILTER_VALUES: "threat",
      }),
    );
    expect(
      wrapper.getComponent({ name: "ConfigFilters" }).props("keys"),
    ).toEqual(["FRONT_END_FILTER_COLUMN", "SECONDARY_FILTER_VALUES"]);
  });
});
