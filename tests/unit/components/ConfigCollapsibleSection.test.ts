import { describe, expect, it } from "vitest";
import { mount } from "@vue/test-utils";
import { computed, ref } from "vue";

import ConfigCollapsibleSection from "@/components/config/ConfigCollapsibleSection.vue";

Object.assign(globalThis, { computed, ref });

const mountSection = (defaultOpen: boolean) =>
  mount(ConfigCollapsibleSection, {
    props: { title: "Map", defaultOpen },
    slots: { default: '<input id="map-field" />' },
    global: {
      stubs: { ChevronDown: true },
    },
  });

describe("ConfigCollapsibleSection", () => {
  it("does not render collapsed section content", () => {
    const wrapper = mountSection(false);

    expect(wrapper.find("#map-field").exists()).toBe(false);
  });

  it("renders content after the section is opened", async () => {
    const wrapper = mountSection(false);

    await wrapper
      .get('[data-testid="config-section-map-toggle"]')
      .trigger("click");

    expect(wrapper.find("#map-field").exists()).toBe(true);
  });

  it("renders content that starts open", () => {
    const wrapper = mountSection(true);

    expect(wrapper.find("#map-field").exists()).toBe(true);
  });
});
