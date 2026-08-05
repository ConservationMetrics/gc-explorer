import { describe, it, expect, vi } from "vitest";
import { mount } from "@vue/test-utils";
import { computed, ref, watchEffect } from "vue";

import MediaFile from "@/components/shared/MediaFile.vue";
import type { AllowedFileExtensions } from "@/types";

Object.assign(globalThis, {
  computed,
  ref,
  watchEffect,
});

const mockT = (key: string) => key;

vi.mock("@/composables/useIntersectionObserver", () => ({
  useIntersectionObserver: (
    callback: (entries: IntersectionObserverEntry[]) => void,
  ) => {
    const target = ref<HTMLElement | null>(null);
    watchEffect(() => {
      if (target.value) {
        callback([{ isIntersecting: true } as IntersectionObserverEntry]);
      }
    });
    return { target };
  },
}));

vi.mock("@/composables/useOptimizedImages", () => ({
  useOptimizedImages: () => ({
    getGalleryImageUrl: (url: string) => url,
  }),
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

describe("MediaFile gallery variant", () => {
  it("renders gallery images without a new-tab image link", async () => {
    const wrapper = mount(MediaFile, {
      props: {
        allowedFileExtensions,
        filePath: "photo.jpg",
        mediaBasePath: "/media",
        variant: "gallery",
      },
      global: globalConfig,
    });

    await wrapper.vm.$nextTick();

    expect(wrapper.find("a[href]").exists()).toBe(false);
    expect(wrapper.find(".h-full").exists()).toBe(true);
    expect(wrapper.text()).toContain("loading");
  });

  it("renders gallery audio as a violet card with icon and filename", () => {
    const wrapper = mount(MediaFile, {
      props: {
        allowedFileExtensions,
        filePath: "field-audio/recording.mp3",
        mediaBasePath: "/media",
        variant: "gallery",
      },
      global: globalConfig,
    });

    expect(wrapper.find("audio").exists()).toBe(true);
    expect(
      wrapper.get('[data-testid="gallery-audio-card"]').classes(),
    ).toContain("bg-violet-50");
    expect(wrapper.find('[data-testid="gallery-audio-icon"]').exists()).toBe(
      true,
    );
    expect(wrapper.get('[data-testid="gallery-audio-filename"]').text()).toBe(
      "recording.mp3",
    );
    expect(wrapper.get("audio").classes()).toContain("w-[calc(100%_-_4rem)]");
  });

  it("leaves default audio rendering unchanged", () => {
    const wrapper = mount(MediaFile, {
      props: {
        allowedFileExtensions,
        filePath: "recording.mp3",
        mediaBasePath: "/media",
      },
      global: globalConfig,
    });

    expect(wrapper.find("audio").exists()).toBe(true);
    expect(wrapper.find('[data-testid="gallery-audio-card"]').exists()).toBe(
      false,
    );
    expect(wrapper.get("audio").classes()).toContain("w-full");
    expect(
      wrapper.find('[data-testid="gallery-audio-filename"]').exists(),
    ).toBe(false);
  });
});
