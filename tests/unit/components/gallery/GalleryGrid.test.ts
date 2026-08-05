import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";

import GalleryGrid from "@/components/gallery/GalleryGrid.vue";

describe("GalleryGrid", () => {
  it("renders a responsive 2-column mobile and 4-column desktop grid", () => {
    const wrapper = mount(GalleryGrid, {
      slots: {
        default: "<div data-testid='slot-item'>tile</div>",
      },
    });

    const grid = wrapper.get('[data-testid="gallery-grid"]');
    expect(grid.classes()).toContain("grid-cols-2");
    expect(grid.classes()).toContain("lg:grid-cols-4");
    expect(wrapper.find('[data-testid="slot-item"]').exists()).toBe(true);
  });
});
