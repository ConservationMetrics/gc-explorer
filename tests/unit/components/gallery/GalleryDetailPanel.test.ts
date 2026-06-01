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

vi.mock("@/components/shared/MediaFile.vue", () => ({
  default: {
    name: "MediaFile",
    props: ["filePath"],
    template: '<div data-testid="stub-detail-media-file">{{ filePath }}</div>',
  },
}));

vi.mock("@/components/shared/DataFeature.vue", () => ({
  default: {
    name: "DataFeature",
    props: ["hideMedia", "embedded"],
    template: '<div data-testid="data-feature"></div>',
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

  it("renders first media file and metadata without duplicating media in DataFeature", () => {
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
    expect(wrapper.find('[data-testid="stub-detail-media-file"]').text()).toBe(
      "photo.jpg",
    );

    const dataFeature = wrapper.findComponent({ name: "DataFeature" });
    expect(dataFeature.props("hideMedia")).toBe(true);
    expect(dataFeature.props("embedded")).toBe(true);
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
