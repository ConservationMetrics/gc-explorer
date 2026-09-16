import { describe, expect, it } from "vitest";
import { mount } from "@vue/test-utils";
import { computed, ref, watch } from "vue";

import BasemapSelector from "@/components/shared/BasemapSelector.vue";

Object.assign(globalThis, {
  computed,
  ref,
  watch,
});

describe("BasemapSelector", () => {
  it("opens the basemap choices from an accessible map control", async () => {
    const wrapper = mount(BasemapSelector, {
      props: {
        mapboxBasemaps: [
          {
            name: "Default Style",
            style: "mapbox://styles/mapbox/streets-v12",
            access_token: "pk.test",
          },
        ],
      },
      global: {
        mocks: {
          $t: (key: string) => key,
        },
      },
    });

    const toggle = wrapper.get(".basemap-toggle");
    expect(toggle.attributes("aria-label")).toBe("selectBasemap");
    expect(toggle.attributes("aria-expanded")).toBe("false");

    await toggle.trigger("click");

    expect(toggle.attributes("aria-expanded")).toBe("true");
    expect(wrapper.get(".basemap-window").text()).toContain("Default Style");
  });
});
