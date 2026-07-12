import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import { computed, ref, watch } from "vue";

import DetailMinimap from "@/components/shared/DetailMinimap.vue";

Object.assign(globalThis, {
  computed,
  ref,
  watch,
});

describe("DetailMinimap", () => {
  it("renders static map image when token and centroid are present", () => {
    const wrapper = mount(DetailMinimap, {
      props: {
        alt: "Location",
        centroid: "3.447040, -76.539950",
        mapboxAccessToken: "pk.test",
        mapboxStyle: "mapbox://styles/mapbox/satellite-streets-v12",
      },
    });

    expect(wrapper.find('[data-testid="detail-minimap"]').exists()).toBe(true);

    const image = wrapper.get('[data-testid="detail-minimap-image"]');
    expect(image.attributes("src")).toContain("api.mapbox.com/styles/v1/");
    expect(image.attributes("alt")).toBe("Location");
  });

  it("stays hidden when token or centroid is missing", () => {
    const wrapper = mount(DetailMinimap, {
      props: {
        centroid: "3.447040, -76.539950",
      },
    });

    expect(wrapper.find('[data-testid="detail-minimap"]').exists()).toBe(false);
  });

  it("hides the image after a load error", async () => {
    const wrapper = mount(DetailMinimap, {
      props: {
        centroid: "3.447040, -76.539950",
        mapboxAccessToken: "pk.test",
      },
    });

    await wrapper.get('[data-testid="detail-minimap-image"]').trigger("error");

    expect(wrapper.find('[data-testid="detail-minimap"]').exists()).toBe(false);
  });
});
