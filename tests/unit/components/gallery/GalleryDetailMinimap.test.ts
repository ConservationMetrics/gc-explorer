import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import { computed, ref, watch } from "vue";

import GalleryDetailMinimap from "@/components/gallery/GalleryDetailMinimap.vue";

Object.assign(globalThis, {
  computed,
  ref,
  watch,
});

const mockT = (key: string) => key;

describe("GalleryDetailMinimap", () => {
  it("renders static map image when token and centroid are present", () => {
    const wrapper = mount(GalleryDetailMinimap, {
      props: {
        centroid: "3.447040, -76.539950",
        mapboxAccessToken: "pk.test",
        mapboxStyle: "mapbox://styles/mapbox/satellite-streets-v12",
      },
      global: {
        mocks: { $t: mockT },
      },
    });

    expect(
      wrapper.find('[data-testid="gallery-detail-minimap"]').exists(),
    ).toBe(true);

    const image = wrapper.get('[data-testid="gallery-detail-minimap-image"]');
    expect(image.attributes("src")).toContain("api.mapbox.com/styles/v1/");
    expect(image.attributes("alt")).toBe("galleryLocation");
  });

  it("stays hidden when token or centroid is missing", () => {
    const wrapper = mount(GalleryDetailMinimap, {
      props: {
        centroid: "3.447040, -76.539950",
      },
      global: {
        mocks: { $t: mockT },
      },
    });

    expect(
      wrapper.find('[data-testid="gallery-detail-minimap"]').exists(),
    ).toBe(false);
  });

  it("hides the image after a load error", async () => {
    const wrapper = mount(GalleryDetailMinimap, {
      props: {
        centroid: "3.447040, -76.539950",
        mapboxAccessToken: "pk.test",
      },
      global: {
        mocks: { $t: mockT },
      },
    });

    await wrapper
      .get('[data-testid="gallery-detail-minimap-image"]')
      .trigger("error");

    expect(
      wrapper.find('[data-testid="gallery-detail-minimap"]').exists(),
    ).toBe(false);
  });
});
