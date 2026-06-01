import { describe, it, expect, vi } from "vitest";
import { mount } from "@vue/test-utils";
import { computed, ref, watchEffect } from "vue";

import GalleryTile from "@/components/gallery/GalleryTile.vue";
import type { AllowedFileExtensions } from "@/types";

Object.assign(globalThis, {
  computed,
  ref,
  watchEffect,
});

const mockT = (key: string) => key;

vi.mock("@/composables/useIntersectionObserver", () => ({
  useIntersectionObserver: () => ({
    target: ref(null),
  }),
}));

vi.mock("@/composables/useOptimizedImages", () => ({
  useOptimizedImages: () => ({
    getGalleryImageUrl: (url: string) => url,
  }),
}));

vi.mock("@/components/shared/MediaFile.vue", () => ({
  default: {
    name: "MediaFile",
    props: ["filePath", "variant"],
    template:
      '<div data-testid="stub-media-file" :data-variant="variant">{{ filePath }}</div>',
  },
}));

const allowedFileExtensions: AllowedFileExtensions = {
  audio: ["mp3", "m4a"],
  image: ["jpg", "jpeg", "png"],
  video: ["mp4"],
};

const globalConfig = {
  mocks: {
    $t: mockT,
  },
};

describe("GalleryTile", () => {
  it("renders an image preview inside rounded gallery chrome", () => {
    const wrapper = mount(GalleryTile, {
      props: {
        allowedFileExtensions,
        filePaths: ["photo.jpg"],
        mediaBasePath: "/media",
        testId: "gallery-item-0",
      },
      global: globalConfig,
    });

    expect(wrapper.find('[data-testid="gallery-item-0"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="stub-media-file"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="stub-media-file"]').text()).toBe(
      "photo.jpg",
    );
    expect(wrapper.find(".rounded-2xl").exists()).toBe(true);
    expect(wrapper.find(".aspect-square").exists()).toBe(true);
  });

  it("renders audio preview through MediaFile with gallery variant", () => {
    const wrapper = mount(GalleryTile, {
      props: {
        allowedFileExtensions,
        filePaths: ["recording.mp3"],
        mediaBasePath: "/media",
        testId: "gallery-item-1",
      },
      global: globalConfig,
    });

    expect(wrapper.find('[data-testid="stub-media-file"]').text()).toBe(
      "recording.mp3",
    );
    expect(
      wrapper
        .find('[data-testid="stub-media-file"]')
        .attributes("data-variant"),
    ).toBe("gallery");
  });

  it("shows a no-media placeholder when file paths are empty", () => {
    const wrapper = mount(GalleryTile, {
      props: {
        allowedFileExtensions,
        filePaths: [],
        mediaBasePath: "/media",
        testId: "gallery-item-2",
      },
      global: globalConfig,
    });

    expect(wrapper.find('[data-testid="gallery-tile-no-media"]').exists()).toBe(
      true,
    );
    expect(wrapper.text()).toContain("galleryEmpty");
    expect(wrapper.find('[data-testid="gallery-tile-overlay"]').exists()).toBe(
      false,
    );
  });

  it("includes a hover overlay with click-to-view-details copy", () => {
    const wrapper = mount(GalleryTile, {
      props: {
        allowedFileExtensions,
        filePaths: ["photo.jpg"],
        mediaBasePath: "/media",
        testId: "gallery-item-3",
      },
      global: globalConfig,
    });

    const overlay = wrapper.get('[data-testid="gallery-tile-overlay"]');
    expect(overlay.classes()).toContain("lg:group-hover:opacity-100");
    expect(overlay.classes()).toContain("lg:group-focus-within:opacity-100");
    expect(overlay.classes()).toContain("opacity-70");
    expect(overlay.classes()).toContain("pointer-events-none");
    expect(overlay.text()).toContain("galleryClickToViewDetails");
  });

  it("hides overlay when suppressOverlay is true", () => {
    const wrapper = mount(GalleryTile, {
      props: {
        allowedFileExtensions,
        filePaths: ["photo.jpg"],
        mediaBasePath: "/media",
        suppressOverlay: true,
        testId: "gallery-item-5",
      },
      global: globalConfig,
    });

    expect(wrapper.find('[data-testid="gallery-tile-overlay"]').exists()).toBe(
      false,
    );
  });

  it("emits open when the tile is clicked", async () => {
    const wrapper = mount(GalleryTile, {
      props: {
        allowedFileExtensions,
        filePaths: ["photo.jpg"],
        mediaBasePath: "/media",
        testId: "gallery-item-6",
      },
      global: globalConfig,
    });

    await wrapper.trigger("click");
    expect(wrapper.emitted("open")).toHaveLength(1);
  });

  it("is keyboard focusable for the overlay affordance", () => {
    const wrapper = mount(GalleryTile, {
      props: {
        allowedFileExtensions,
        filePaths: ["photo.jpg"],
        mediaBasePath: "/media",
        testId: "gallery-item-4",
      },
      global: globalConfig,
    });

    expect(wrapper.attributes("tabindex")).toBe("0");
    expect(wrapper.attributes("role")).toBe("button");
  });
});
