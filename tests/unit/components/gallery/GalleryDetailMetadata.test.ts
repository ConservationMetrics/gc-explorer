import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import { computed, ref, watch } from "vue";

import GalleryDetailMetadata from "@/components/gallery/GalleryDetailMetadata.vue";
import type {
  AllowedFileExtensions,
  DataEntry,
  GalleryAttachment,
} from "@/types";

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
        attachments: [],
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
        attachments: [],
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

  it("renders parsed attachment metadata with download links", () => {
    const attachments: GalleryAttachment[] = [
      {
        name: "example photo.jpg",
        mimetype: "image/jpeg",
        questionXpath: "photo",
        downloadUrl: "https://example.test/original",
        downloadLargeUrl: "https://example.test/large",
        downloadMediumUrl: "https://example.test/medium",
        downloadSmallUrl: "https://example.test/small",
        id: 134806447,
        uid: "attExampleUid",
      },
    ];

    const wrapper = mount(GalleryDetailMetadata, {
      props: {
        allowedFileExtensions,
        attachments,
        feature: { _id: "1" },
        filePaths: ["photo.jpg"],
        mediaBasePath: "/media",
      },
      global: globalConfig,
    });

    expect(wrapper.text()).toContain("galleryFiles");
    expect(wrapper.text()).toContain("example photo.jpg");
    expect(wrapper.text()).toContain("image/jpeg");
    expect(wrapper.text()).toContain("photo");
    expect(wrapper.text()).toContain("ID 134806447");
    expect(wrapper.text()).toContain("UID attExampleUid");
    expect(wrapper.text()).toContain("galleryDownloadOriginal");
    expect(wrapper.text()).toContain("galleryDownloadLarge");

    const links = wrapper.findAll(
      '[data-testid="gallery-metadata-attachment-link"]',
    );
    expect(links.length).toBeGreaterThanOrEqual(2);
    expect(links[0].attributes("href")).toBe("https://example.test/original");
  });

  it("renders minimap below coordinate fields when token and centroid are set", () => {
    const wrapper = mount(GalleryDetailMetadata, {
      props: {
        allowedFileExtensions,
        attachments: [],
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

    expect(
      wrapper.find('[data-testid="gallery-detail-minimap"]').exists(),
    ).toBe(true);
  });

  it("renders structured file links with icons when attachments are absent", () => {
    const wrapper = mount(GalleryDetailMetadata, {
      props: {
        allowedFileExtensions,
        attachments: [],
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
    expect(links[1].text()).toContain("clip.mp4");
    expect(links[2].text()).toContain("note.mp3");
  });
});
