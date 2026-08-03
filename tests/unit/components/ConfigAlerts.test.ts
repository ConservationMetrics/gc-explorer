import { describe, expect, it, vi } from "vitest";
import { mount } from "@vue/test-utils";
import { ref } from "vue";

import ConfigAlerts from "@/components/config/ConfigAlerts.vue";

Object.assign(globalThis, { ref });

vi.mock("@vojtechlanka/vue-tags-input", () => ({
  VueTagsInput: {
    name: "VueTagsInput",
    template: "<div />",
  },
}));

const mountConfigAlerts = () =>
  mount(ConfigAlerts, {
    props: {
      tableName: "alerts_table",
      config: {
        FRONT_END_FILTER_COLUMN: "status",
        SECONDARY_FILTER_VALUES: "active,pending",
      },
      views: ["alerts"],
      keys: ["FRONT_END_FILTER_COLUMN", "SECONDARY_FILTER_VALUES"],
    },
    global: {
      stubs: {
        VueTagsInput: {
          name: "VueTagsInput",
          props: ["tags"],
          emits: ["tags-changed"],
          template:
            "<button data-testid=\"filter-values\" @click=\"$emit('tags-changed', [{ text: 'active' }])\" />",
        },
      },
      mocks: {
        $t: (key: string) => key,
      },
    },
  });

describe("ConfigAlerts", () => {
  it("updates the secondary filter column", async () => {
    const wrapper = mountConfigAlerts();

    await wrapper
      .get<HTMLInputElement>("#alerts_table-FRONT_END_FILTER_COLUMN")
      .setValue("status_type");

    expect(wrapper.emitted("updateConfig")?.[0]?.[0]).toEqual({
      FRONT_END_FILTER_COLUMN: "status_type",
    });
  });

  it("writes generic include values and clears legacy keys", async () => {
    const wrapper = mountConfigAlerts();

    await wrapper.get('[data-testid="filter-values"]').trigger("click");

    expect(wrapper.emitted("updateConfig")?.[0]?.[0]).toEqual({
      SECONDARY_FILTER_VALUES: "active",
      SECONDARY_CATEGORY_IDS: undefined,
      MAPEO_CATEGORY_IDS: undefined,
    });
  });
});
