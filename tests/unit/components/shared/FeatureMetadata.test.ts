import { describe, it, expect, vi } from "vitest";
import { mount } from "@vue/test-utils";
import { computed, nextTick, ref, watch } from "vue";

import FeatureMetadata from "@/components/shared/FeatureMetadata.vue";
import type { AllowedFileExtensions, DataEntry } from "@/types";

vi.mock("@/components/shared/MediaFile.vue", () => ({
  default: {
    name: "MediaFile",
    props: [
      "allowedFileExtensions",
      "filePath",
      "mediaBasePath",
      "imageModalMode",
    ],
    template: '<div data-testid="media-file" />',
  },
}));

Object.assign(globalThis, {
  computed,
  ref,
  watch,
});

const mockT = (key: string) => key;

const allowedFileExtensions: AllowedFileExtensions = {
  audio: ["mp3"],
  image: ["jpg", "png"],
  video: ["mp4"],
};

const globalConfig = {
  mocks: {
    $t: mockT,
  },
};

describe("FeatureMetadata", () => {
  it("renders visible fields with violet labels and hides excluded keys", () => {
    const feature: DataEntry = {
      _id: "1",
      abundance: "High",
      plantSpecies: "Test plant",
      uuid: "hidden-uuid",
      photo: "hidden.jpg",
      audio: "hidden.mp3",
      dataSource: "Test source",
      attachmentMeta: '{"file":"x.jpg"}',
    };

    const wrapper = mount(FeatureMetadata, {
      props: {
        allowedFileExtensions,
        feature,
        filePaths: [],
        mediaBasePath: "/media",
      },
      global: globalConfig,
    });

    const labels = wrapper
      .findAll('[data-testid="gallery-metadata-label"]')
      .map((node) => node.text());
    const values = wrapper
      .findAll('[data-testid="gallery-metadata-value"]')
      .map((node) => node.text());

    expect(labels).toContain("Abundance");
    expect(labels).toContain("Plant Species");
    expect(values.some((value) => value.includes("High"))).toBe(true);
    expect(labels).not.toContain("Uuid");
    expect(labels).not.toContain("Photo");
    expect(labels).not.toContain("Audio");
    expect(labels).not.toContain("Data source");
    expect(labels).not.toContain("Attachment meta");
  });

  it("renders Google Maps link for coordinate fields", () => {
    const feature: DataEntry = {
      _id: "1",
      geocoordinates: "3.44, -76.54",
    };

    const wrapper = mount(FeatureMetadata, {
      props: {
        allowedFileExtensions,
        feature,
        filePaths: [],
        mediaBasePath: "/media",
      },
      global: globalConfig,
    });

    const link = wrapper.find('[data-testid="google-maps-link"]');
    expect(link.exists()).toBe(true);
    expect(link.attributes("href")).toContain("3.44, -76.54");
    expect(link.text()).toContain("viewOnGoogleMaps");
  });

  it("renders Filebrowser links for gallery media file paths", () => {
    const wrapper = mount(FeatureMetadata, {
      props: {
        allowedFileExtensions,
        feature: { _id: "1" },
        filePaths: ["folder/photo.jpg", "clip.mp4", "note.mp3"],
        mediaBasePath: "/media",
      },
      global: globalConfig,
    });

    expect(
      wrapper.find('[data-testid="gallery-metadata-files"]').exists(),
    ).toBe(true);
    expect(wrapper.text()).toContain("galleryFiles");

    const links = wrapper.findAll('[data-testid="gallery-metadata-file-link"]');
    expect(links).toHaveLength(3);
    expect(links[0].attributes("href")).toBe("/media/folder/photo.jpg");
    expect(links[0].text()).toContain("photo.jpg");
    expect(links[1].attributes("href")).toBe("/media/clip.mp4");
    expect(links[1].text()).toContain("clip.mp4");
    expect(links[2].attributes("href")).toBe("/media/note.mp3");
    expect(links[2].text()).toContain("note.mp3");
  });

  it("renders embedded media when enabled", () => {
    const wrapper = mount(FeatureMetadata, {
      props: {
        allowedFileExtensions,
        feature: { _id: "1" },
        filePaths: ["t0.jpg", "t1.jpg"],
        isAlert: true,
        mediaBasePath: "/alerts-media",
        showMedia: true,
      },
      global: globalConfig,
    });

    const mediaContainer = wrapper.get('[data-testid="media-files-container"]');
    expect(mediaContainer.classes()).toContain("grid-cols-2");

    const mediaFiles = wrapper.findAllComponents({ name: "MediaFile" });
    expect(mediaFiles).toHaveLength(2);
    expect(mediaFiles[0].props("filePath")).toBe("t0.jpg");
    expect(mediaFiles[0].props("mediaBasePath")).toBe("/alerts-media");
    expect(
      wrapper.find('[data-testid="gallery-metadata-files"]').exists(),
    ).toBe(false);
  });

  it("opens before and after images together for primary alerts", async () => {
    const wrapper = mount(FeatureMetadata, {
      props: {
        allowedFileExtensions,
        feature: { _id: "1" },
        filePaths: ["images/S2_T1_123.jpg", "images/S2_T0_123.jpg"],
        isAlert: true,
        mediaBasePath: "/alerts-media",
        showMedia: true,
      },
      global: globalConfig,
    });

    const mediaFiles = wrapper.findAllComponents({ name: "MediaFile" });
    expect(mediaFiles[0].props("imageModalMode")).toBe("comparison");

    mediaFiles[0].vm.$emit("image-click");
    await nextTick();

    const modal = document.querySelector(
      '[data-testid="media-image-comparison-modal"]',
    );
    expect(modal).toBeTruthy();
    expect(modal?.querySelectorAll("img")).toHaveLength(2);
    expect(modal?.textContent).toContain("before");
    expect(modal?.textContent).toContain("after");

    modal
      ?.querySelector<HTMLButtonElement>(
        '[data-testid="media-image-comparison-modal-close"]',
      )
      ?.click();
    await nextTick();
    expect(
      document.querySelector('[data-testid="media-image-comparison-modal"]'),
    ).toBeFalsy();
  });

  it("renders minimap below coordinate fields when token and centroid are set", () => {
    const wrapper = mount(FeatureMetadata, {
      props: {
        allowedFileExtensions,
        centroid: "3.44, -76.54",
        feature: {
          _id: "1",
          geocoordinates: "3.44, -76.54",
        },
        filePaths: [],
        mapboxAccessToken: "pk.test",
        mapboxStyle: "mapbox://styles/mapbox/satellite-streets-v12",
        mediaBasePath: "/media",
      },
      global: globalConfig,
    });

    expect(wrapper.find('[data-testid="detail-minimap"]').exists()).toBe(true);
  });

  it("hides the minimap when showMiniMap is false", () => {
    const wrapper = mount(FeatureMetadata, {
      props: {
        allowedFileExtensions,
        centroid: "3.44, -76.54",
        feature: {
          _id: "1",
          geocoordinates: "3.44, -76.54",
        },
        filePaths: [],
        mapboxAccessToken: "pk.test",
        mapboxStyle: "mapbox://styles/mapbox/satellite-streets-v12",
        mediaBasePath: "/media",
        showMiniMap: false,
      },
      global: globalConfig,
    });

    expect(wrapper.find('[data-testid="detail-minimap"]').exists()).toBe(false);
    expect(wrapper.text()).toContain("3.44, -76.54");
  });
});
