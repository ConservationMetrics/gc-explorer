import { describe, it, expect, vi } from "vitest";
import { mount } from "@vue/test-utils";
import { computed, ref, watch } from "vue";

import GalleryMediaCarousel from "@/components/gallery/GalleryMediaCarousel.vue";
import type { AllowedFileExtensions } from "@/types";

Object.assign(globalThis, {
  computed,
  ref,
  watch,
});

const mockT = (key: string, params?: Record<string, unknown>) => {
  if (params) return `${key}:${JSON.stringify(params)}`;
  return key;
};

vi.mock("vue-i18n", () => ({
  useI18n: () => ({ t: mockT }),
}));

Object.assign(globalThis, {
  useI18n: () => ({ t: mockT }),
});

vi.mock("@/components/shared/MediaFile.vue", () => ({
  default: {
    name: "MediaFile",
    props: ["filePath"],
    template:
      '<div data-testid="stub-carousel-media-file">{{ filePath }}</div>',
  },
}));

const allowedFileExtensions: AllowedFileExtensions = {
  audio: ["mp3"],
  image: ["jpg"],
  video: ["mp4"],
};

describe("GalleryMediaCarousel", () => {
  it("renders only the current slide media file", () => {
    const wrapper = mount(GalleryMediaCarousel, {
      props: {
        allowedFileExtensions,
        filePaths: ["a.jpg", "b.jpg"],
        mediaBasePath: "/media",
      },
    });

    expect(
      wrapper.find('[data-testid="stub-carousel-media-file"]').text(),
    ).toBe("a.jpg");
    expect(wrapper.find('[data-testid="gallery-carousel-prev"]').exists()).toBe(
      true,
    );
    expect(wrapper.find('[data-testid="gallery-carousel-next"]').exists()).toBe(
      true,
    );
    expect(
      wrapper.get('[data-testid="gallery-carousel-prev"]').classes(),
    ).toEqual(expect.arrayContaining(["top-1/2", "-translate-y-1/2"]));
    expect(
      wrapper.findAll('[data-testid^="gallery-carousel-dot-"]'),
    ).toHaveLength(2);
  });

  it("advances to the next slide when next is clicked", async () => {
    const wrapper = mount(GalleryMediaCarousel, {
      props: {
        allowedFileExtensions,
        filePaths: ["a.jpg", "b.jpg"],
        mediaBasePath: "/media",
      },
    });

    await wrapper.get('[data-testid="gallery-carousel-next"]').trigger("click");
    expect(
      wrapper.find('[data-testid="stub-carousel-media-file"]').text(),
    ).toBe("b.jpg");
  });

  it("keeps 40px carousel controls in place across audio and image slides", async () => {
    const wrapper = mount(GalleryMediaCarousel, {
      props: {
        allowedFileExtensions,
        filePaths: ["a.jpg", "recording.mp3"],
        mediaBasePath: "/media",
      },
    });

    const controlClasses = () =>
      ["gallery-carousel-prev", "gallery-carousel-next"].map((testId) =>
        wrapper.get(`[data-testid="${testId}"]`).classes().sort().join(" "),
      );

    const imageSlideClasses = controlClasses();
    await wrapper.get('[data-testid="gallery-carousel-next"]').trigger("click");

    expect(controlClasses()).toEqual(imageSlideClasses);
    for (const testId of ["gallery-carousel-prev", "gallery-carousel-next"]) {
      expect(wrapper.get(`[data-testid="${testId}"]`).classes()).toEqual(
        expect.arrayContaining(["top-1/2", "-translate-y-1/2", "h-10", "w-10"]),
      );
    }
  });

  it("does not render carousel controls for a single file", () => {
    const wrapper = mount(GalleryMediaCarousel, {
      props: {
        allowedFileExtensions,
        filePaths: ["a.jpg"],
        mediaBasePath: "/media",
      },
    });

    expect(wrapper.find('[data-testid="gallery-carousel-prev"]').exists()).toBe(
      false,
    );
    expect(wrapper.find('[data-testid="gallery-carousel-dots"]').exists()).toBe(
      false,
    );
  });
});
