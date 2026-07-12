import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import { computed } from "vue";

import GalleryDetailMetadata from "@/components/gallery/GalleryDetailMetadata.vue";
import type { AllowedFileExtensions, DataEntry } from "@/types";

Object.assign(globalThis, {
  computed,
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

describe("GalleryDetailMetadata", () => {
  it("renders visible fields with violet labels and hides excluded keys", () => {
    const feature: DataEntry = {
      _id: "1",
      abundance: "High",
      uuid: "hidden-uuid",
      photo: "hidden.jpg",
      audio: "hidden.mp3",
      dataSource: "Test source",
      attachmentMeta: '{"file":"x.jpg"}',
    };

    const wrapper = mount(GalleryDetailMetadata, {
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

    const wrapper = mount(GalleryDetailMetadata, {
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
    const wrapper = mount(GalleryDetailMetadata, {
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
});
