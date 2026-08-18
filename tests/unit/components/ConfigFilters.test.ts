import { describe, expect, it, vi } from "vitest";
import { mount } from "@vue/test-utils";
import { ref } from "vue";

import ConfigFilters from "@/components/config/ConfigFilters.vue";

Object.assign(globalThis, { ref });

vi.mock("@vojtechlanka/vue-tags-input", () => ({
  VueTagsInput: {
    name: "VueTagsInput",
    template: "<div />",
  },
}));

const mountConfigFilters = () =>
  mount(ConfigFilters, {
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

describe("ConfigFilters", () => {
  it("updates the filter column", async () => {
    const wrapper = mountConfigFilters();

    await wrapper
      .get<HTMLInputElement>("#alerts_table-FRONT_END_FILTER_COLUMN")
      .setValue("status_type");

    expect(wrapper.emitted("updateConfig")?.[0]?.[0]).toEqual({
      FRONT_END_FILTER_COLUMN: "status_type",
    });
  });

  it("updates secondary include values", async () => {
    const wrapper = mountConfigFilters();

    await wrapper.get('[data-testid="filter-values"]').trigger("click");

    expect(wrapper.emitted("updateConfig")?.[0]?.[0]).toEqual({
      SECONDARY_FILTER_VALUES: "active",
    });
  });

  it("keeps tag fields full width of the grid", () => {
    const wrapper = mountConfigFilters();

    expect(wrapper.get(".tag-field").classes()).toContain("w-full");
    expect(
      wrapper.get(".tag-field").element.parentElement?.className,
    ).toContain("md:col-span-2");
  });
});
