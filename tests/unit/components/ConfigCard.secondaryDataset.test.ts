import { describe, expect, it } from "vitest";
import { mount } from "@vue/test-utils";
import { computed, nextTick, ref, watch } from "vue";

import ConfigCard from "@/components/config/ConfigCard.vue";
import type { ViewType } from "@/types";

Object.assign(globalThis, {
  computed,
  nextTick,
  ref,
  watch,
});

const mountConfigCard = (viewType: ViewType) =>
  mount(ConfigCard, {
    props: {
      tableName: "primary_dataset",
      viewType,
      viewConfig: {
        MAPBOX_ACCESS_TOKEN: "pk.ey.test-token",
        ROUTE_LEVEL_PERMISSION: "member",
      },
      secondaryDataset: "old_secondary",
      secondaryEditable: true,
    },
    global: {
      stubs: {
        ConfigAlerts: true,
        ConfigCollapsibleSection: {
          template: "<div><slot /></div>",
        },
        ConfigFilters: true,
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
