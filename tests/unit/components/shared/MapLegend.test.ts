import { describe, expect, it } from "vitest";
import { mount } from "@vue/test-utils";
import { onMounted, ref, watch } from "vue";

import MapLegend from "@/components/shared/MapLegend.vue";

Object.assign(globalThis, {
  onMounted,
  ref,
  watch,
});

const mapLegendContent = [
  {
    id: "recent-alerts",
    name: "Most recent alerts",
    type: "circle",
    color: "#ef4444",
  },
];

describe("MapLegend", () => {
  it("provides visible open and close controls", async () => {
    const wrapper = mount(MapLegend, {
      props: { mapLegendContent },
      global: {
        mocks: {
          $t: (key: string) => key,
        },
      },
    });

    const toggle = wrapper.get('[data-testid="map-legend-toggle"]');
    expect(toggle.find("svg").exists()).toBe(true);
    expect(toggle.attributes("aria-expanded")).toBe("false");
    expect(wrapper.find('[data-testid="map-legend-close"]').exists()).toBe(
      false,
    );

    await toggle.trigger("click");
    expect(wrapper.find('[data-testid="map-legend-toggle"]').exists()).toBe(
      false,
    );
    expect(wrapper.find('[data-testid="map-legend-close"]').exists()).toBe(
      true,
    );
    expect(wrapper.find('[data-testid="map-legend-checkbox"]').exists()).toBe(
      true,
    );

    await wrapper.get('[data-testid="map-legend-close"]').trigger("click");
    expect(
      wrapper
        .get('[data-testid="map-legend-toggle"]')
        .attributes("aria-expanded"),
    ).toBe("false");
    expect(wrapper.find('[data-testid="map-legend-checkbox"]').exists()).toBe(
      false,
    );
  });
});
