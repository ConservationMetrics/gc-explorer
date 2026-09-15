import { describe, it, expect, vi, beforeEach } from "vitest";
import { mount } from "@vue/test-utils";
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
} from "vue";

import ViewSidebar from "@/components/shared/ViewSidebar.vue";
import type {
  AlertsStatistics,
  AllowedFileExtensions,
  DataEntry,
  MapStatistics,
} from "@/types";
import type { Feature, FeatureCollection } from "geojson";

Object.assign(globalThis, {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
});

const copyLink = vi.fn();
const showCopied = ref(false);

vi.mock("@/composables/useCopyLink", () => ({
  useCopyLink: () => ({ showCopied, copyLink }),
}));

vi.mock("@/components/shared/DownloadMapData.vue", () => ({
  default: {
    name: "DownloadMapData",
    template: '<div data-testid="download-map-data" />',
  },
}));

vi.mock("@/components/shared/MediaFile.vue", () => ({
  default: {
    name: "MediaFile",
    template: '<div data-testid="media-file" />',
  },
}));

vi.mock("@/components/alerts/AlertsIntroPanel.vue", () => ({
  default: {
    name: "AlertsIntroPanel",
    template: '<div data-testid="alerts-intro-panel" />',
  },
}));

vi.mock("@/components/map/MapIntroPanel.vue", () => ({
  default: {
    name: "MapIntroPanel",
    template: '<div data-testid="map-intro-panel" />',
  },
}));

const mockT = (key: string) => key;

const allowedFileExtensions: AllowedFileExtensions = {
  audio: ["mp3"],
  image: ["jpg"],
  video: ["mp4"],
};

const feature: DataEntry = {
  _id: "1",
  abundance: "High",
  geocoordinates: "3.44, -76.54",
};

const featureGeojson: Feature = {
  type: "Feature",
  geometry: { type: "Point", coordinates: [-76.54, 3.44] },
  properties: { _id: "1" },
};

const mapStatistics: MapStatistics = { totalFeatures: 1 };
const alertsStatistics = { alertsTotal: 0 } as AlertsStatistics;

const emptyCollection: FeatureCollection = {
  type: "FeatureCollection",
  features: [],
};

const globalConfig = {
  mocks: {
    $t: mockT,
  },
};

describe("ViewSidebar", () => {
  beforeEach(() => {
    copyLink.mockClear();
    showCopied.value = false;
  });

  it("shows FeatureMetadata without a minimap when a map point is selected", () => {
    const wrapper = mount(ViewSidebar, {
      props: {
        allowedFileExtensions,
        feature,
        featureGeojson,
        filePaths: ["photo.jpg"],
        mediaBasePath: "/media",
        showSidebar: true,
        showIntroPanel: false,
      },
      global: globalConfig,
    });

    expect(wrapper.find('[data-testid="feature-metadata"]').exists()).toBe(
      true,
    );
    expect(wrapper.find('[data-testid="data-feature"]').exists()).toBe(false);
    expect(wrapper.find('[data-testid="detail-minimap"]').exists()).toBe(false);
    expect(wrapper.find('[data-testid="copy-link-section"]').exists()).toBe(
      false,
    );
    expect(wrapper.find('[data-testid="download-map-data"]').exists()).toBe(
      true,
    );

    const metadata = wrapper.findComponent({ name: "FeatureMetadata" });
    expect(metadata.props("showMiniMap")).toBe(false);
    expect(metadata.props("showMedia")).toBe(true);
    expect(metadata.props("mediaBasePath")).toBe("/media");
  });

  it("shows FeatureMetadata, copy-link, and alert media path when an alert is selected", () => {
    const wrapper = mount(ViewSidebar, {
      props: {
        allowedFileExtensions,
        feature,
        featureGeojson,
        filePaths: ["alert.jpg"],
        isAlert: true,
        isAlertsDashboard: true,
        isSecondary: false,
        mediaBasePath: "/media",
        mediaBasePathAlerts: "/alerts-media",
        showSidebar: true,
        showIntroPanel: false,
      },
      global: globalConfig,
    });

    expect(wrapper.find('[data-testid="feature-metadata"]').exists()).toBe(
      true,
    );
    expect(wrapper.find('[data-testid="copy-link-section"]').exists()).toBe(
      true,
    );
    expect(wrapper.find('[data-testid="data-feature"]').exists()).toBe(false);
    expect(wrapper.find('[data-testid="detail-minimap"]').exists()).toBe(false);

    const metadata = wrapper.findComponent({ name: "FeatureMetadata" });
    expect(metadata.props("showMiniMap")).toBe(false);
    expect(metadata.props("showMedia")).toBe(true);
    expect(metadata.props("isAlert")).toBe(true);
    expect(metadata.props("mediaBasePath")).toBe("/alerts-media");
  });

  it("uses the alert copy-link label and emits close from the X button", async () => {
    const wrapper = mount(ViewSidebar, {
      props: {
        allowedFileExtensions,
        feature,
        isAlertsDashboard: true,
        showSidebar: true,
        showIntroPanel: false,
      },
      global: globalConfig,
    });

    const copyButton = wrapper.get('[data-testid="copy-link-button"]');
    expect(copyButton.text()).toContain("copyLink");
    await copyButton.trigger("click");
    expect(copyLink).toHaveBeenCalledTimes(1);

    const closeButton = wrapper
      .findAll("button")
      .find((button) => button.text().includes("Close"));
    expect(closeButton).toBeDefined();
    await closeButton!.trigger("click");
    expect(wrapper.emitted("close")).toBeTruthy();
  });

  it("still shows the map intro when no feature is selected", () => {
    const wrapper = mount(ViewSidebar, {
      props: {
        mapStatistics,
        mapFeatureCollection: emptyCollection,
        showIntroPanel: true,
        showSidebar: true,
      },
      global: globalConfig,
    });

    expect(wrapper.find('[data-testid="map-intro-panel"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="feature-metadata"]').exists()).toBe(
      false,
    );
  });

  it("shows the scroll indicator only for the alerts intro panel", async () => {
    const mapWrapper = mount(ViewSidebar, {
      props: {
        mapStatistics,
        mapFeatureCollection: emptyCollection,
        showIntroPanel: true,
        showSidebar: true,
      },
      global: globalConfig,
      attachTo: document.body,
    });
    const mapSidebar = mapWrapper.get(".sidebar").element;
    Object.defineProperties(mapSidebar, {
      offsetHeight: { configurable: true, value: 50 },
      scrollHeight: { configurable: true, value: 100 },
    });
    window.dispatchEvent(new Event("resize"));
    await nextTick();
    expect(mapWrapper.find(".scroll-indicator").exists()).toBe(false);
    mapWrapper.unmount();

    const alertsWrapper = mount(ViewSidebar, {
      props: {
        alertsStatistics,
        isAlertsDashboard: true,
        showIntroPanel: true,
        showSidebar: true,
      },
      global: globalConfig,
      attachTo: document.body,
    });
    const alertsSidebar = alertsWrapper.get(".sidebar").element;
    Object.defineProperties(alertsSidebar, {
      offsetHeight: { configurable: true, value: 50 },
      scrollHeight: { configurable: true, value: 100 },
    });
    window.dispatchEvent(new Event("resize"));
    await nextTick();
    expect(alertsWrapper.find(".scroll-indicator").exists()).toBe(true);
  });
});
