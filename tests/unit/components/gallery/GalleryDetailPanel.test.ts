import { describe, it, expect, vi, beforeEach } from "vitest";
import { mount } from "@vue/test-utils";
import { computed, onBeforeUnmount, onMounted, ref } from "vue";

import GalleryDetailPanel from "@/components/gallery/GalleryDetailPanel.vue";
import type { AllowedFileExtensions, DataEntry } from "@/types";

Object.assign(globalThis, {
  computed,
  onBeforeUnmount,
  onMounted,
  ref,
});

const mockT = (key: string) => key;

vi.mock("@/components/gallery/GalleryMediaCarousel.vue", () => ({
  default: {
    name: "GalleryMediaCarousel",
    props: ["filePaths"],
    template:
      '<div data-testid="stub-detail-carousel">{{ filePaths.join(",") }}</div>',
  },
}));

vi.mock("@/components/gallery/GalleryDetailMetadata.vue", () => ({
  default: {
    name: "GalleryDetailMetadata",
    props: ["feature", "filePaths"],
    template: '<div data-testid="gallery-detail-metadata-fields"></div>',
  },
}));

const allowedFileExtensions: AllowedFileExtensions = {
  audio: ["mp3"],
  image: ["jpg"],
  video: ["mp4"],
};

const feature: DataEntry = {
  _id: "1",
  abundance: "High",
};

const globalConfig = {
  mocks: {
    $t: mockT,
  },
};

describe("GalleryDetailPanel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders carousel and gallery metadata without duplicating media", () => {
    const wrapper = mount(GalleryDetailPanel, {
      props: {
        allowedFileExtensions,
        feature,
        filePaths: ["photo.jpg", "audio.mp3"],
        mediaBasePath: "/media",
      },
      global: globalConfig,
    });

    expect(wrapper.find('[data-testid="gallery-detail-panel"]').exists()).toBe(
      true,
    );
    expect(wrapper.find('[data-testid="stub-detail-carousel"]').text()).toBe(
      "photo.jpg,audio.mp3",
    );

    const metadata = wrapper.findComponent({ name: "GalleryDetailMetadata" });
    expect(metadata.exists()).toBe(true);
    expect(metadata.props("filePaths")).toEqual(["photo.jpg", "audio.mp3"]);
  });

  it("emits close when the back-to-gallery control is clicked", async () => {
    const wrapper = mount(GalleryDetailPanel, {
      props: {
        allowedFileExtensions,
        feature,
        filePaths: ["photo.jpg"],
        mediaBasePath: "/media",
      },
      global: globalConfig,
    });

    await wrapper.get('[data-testid="gallery-detail-back"]').trigger("click");
    expect(wrapper.emitted("close")).toHaveLength(1);
  });

  it("emits close when the close button is clicked", async () => {
    const wrapper = mount(GalleryDetailPanel, {
      props: {
        allowedFileExtensions,
        feature,
        filePaths: ["photo.jpg"],
        mediaBasePath: "/media",
      },
      global: globalConfig,
    });

    await wrapper.get('[data-testid="gallery-detail-close"]').trigger("click");
    expect(wrapper.emitted("close")).toHaveLength(1);
  });

  it("emits close when Escape is pressed", () => {
    const wrapper = mount(GalleryDetailPanel, {
      props: {
        allowedFileExtensions,
        feature,
        filePaths: ["photo.jpg"],
        mediaBasePath: "/media",
      },
      global: globalConfig,
      attachTo: document.body,
    });

    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    expect(wrapper.emitted("close")).toHaveLength(1);
    wrapper.unmount();
  });
});
