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
  it("renders gallery images without a lightbox link", async () => {
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

    expect(wrapper.find("a[data-lightbox]").exists()).toBe(false);
    expect(wrapper.find(".h-full").exists()).toBe(true);
    expect(wrapper.text()).toContain("loading");
  });

  it("wraps gallery audio in a rounded violet container", () => {
    const wrapper = mount(MediaFile, {
      props: {
        allowedFileExtensions,
        filePath: "recording.mp3",
        mediaBasePath: "/media",
        variant: "gallery",
      },
      global: globalConfig,
    });

    expect(wrapper.find("audio").exists()).toBe(true);
    expect(wrapper.find(".bg-violet-50").exists()).toBe(true);
    expect(wrapper.find(".rounded-2xl").exists()).toBe(true);
  });
});
