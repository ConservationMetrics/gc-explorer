import { describe, it, expect, beforeEach, vi } from "vitest";
import { mount } from "@vue/test-utils";
import { ref, computed } from "vue";
import DownloadMapData from "@/components/shared/DownloadMapData.vue";
import type { FeatureCollection } from "geojson";

// Mock useRoute globally
const useRoute = vi.fn(() => ({
  params: {
    tablename: "test_data",
  },
  query: {},
  path: "/test",
}));

const mockT = (key: string) => key;
const mockUseI18n = () => ({ t: mockT });
const mockUseToast = () => ({
  warning: vi.fn(),
  error: vi.fn(),
});

const mockUseRuntimeConfig = () => ({
  public: { appApiKey: "test-key" },
});

Object.assign(globalThis, {
  ref,
  computed,
  useRoute,
  useI18n: mockUseI18n,
  useToast: mockUseToast,
  useRuntimeConfig: mockUseRuntimeConfig,
  $fetch: vi.fn(),
});

// Mock i18n for template $t
vi.mock("vue-i18n", () => ({
  useI18n: mockUseI18n,
}));

const globalConfig = {
  mocks: {
    $t: mockT,
  },
};

describe("DownloadMapData component", () => {
  const simpleFeatureCollection: FeatureCollection = {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: [34.6729698, 1.0178816],
        },
        properties: {
          id: "1",
          name: "Test Location",
        },
      },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Component rendering", () => {
    it("should render without crashing", () => {
      const wrapper = mount(DownloadMapData, {
        props: {
          dataForDownload: simpleFeatureCollection,
        },
        global: globalConfig,
      });

      expect(wrapper.exists()).toBe(true);
    });

    it("should render three download buttons", () => {
      const wrapper = mount(DownloadMapData, {
        props: {
          dataForDownload: simpleFeatureCollection,
        },
        global: globalConfig,
      });

      const buttons = wrapper.findAll("button");
      expect(buttons.length).toBe(3);
    });

    it("should render CSV download button with correct text", () => {
      const wrapper = mount(DownloadMapData, {
        props: {
          dataForDownload: simpleFeatureCollection,
        },
        global: globalConfig,
      });

      const buttons = wrapper.findAll("button");
      expect(buttons[0].text()).toContain("downloadCSV");
    });

    it("should render GeoJSON download button with correct text", () => {
      const wrapper = mount(DownloadMapData, {
        props: {
          dataForDownload: simpleFeatureCollection,
        },
        global: globalConfig,
      });

      const buttons = wrapper.findAll("button");
      expect(buttons[1].text()).toContain("downloadGeoJSON");
    });

    it("should render KML download button with correct text", () => {
      const wrapper = mount(DownloadMapData, {
        props: {
          dataForDownload: simpleFeatureCollection,
        },
        global: globalConfig,
      });

      const buttons = wrapper.findAll("button");
      expect(buttons[2].text()).toContain("downloadKML");
    });
  });

  describe("Props handling", () => {
    it("should accept FeatureCollection as dataForDownload", () => {
      const wrapper = mount(DownloadMapData, {
        props: {
          dataForDownload: simpleFeatureCollection,
        },
        global: globalConfig,
      });

      expect(wrapper.props("dataForDownload")).toEqual(simpleFeatureCollection);
    });

    it("should render without props", () => {
      const wrapper = mount(DownloadMapData, {
        global: globalConfig,
      });

      expect(wrapper.exists()).toBe(true);
    });
  });

  describe("Button styling", () => {
    it("should have proper CSS classes on buttons", () => {
      const wrapper = mount(DownloadMapData, {
        props: {
          dataForDownload: simpleFeatureCollection,
        },
        global: globalConfig,
      });

      const buttons = wrapper.findAll("button");
      buttons.forEach((button) => {
        expect(button.classes()).toContain("bg-blue-500");
        expect(button.classes()).toContain("text-white");
        expect(button.classes()).toContain("hover:bg-blue-600");
      });
    });
  });

  describe("Bulk export with filter params", () => {
    const fetchMock = vi.fn().mockResolvedValue(new Blob());
    beforeEach(() => {
      (globalThis as unknown as { $fetch: ReturnType<typeof vi.fn> }).$fetch =
        fetchMock;
      global.URL.createObjectURL = vi.fn(() => "blob:mock-url");
      global.URL.revokeObjectURL = vi.fn();
    });

    it("calls export endpoint with filterColumn and filterValues when provided", async () => {
      const wrapper = mount(DownloadMapData, {
        props: {
          dataForDownload: simpleFeatureCollection,
          exportFilterColumn: "category",
          exportFilterValues: ["active", "inactive"],
        },
        global: globalConfig,
      });

      const csvButton = wrapper.findAll("button")[0];
      await csvButton.trigger("click");
      await wrapper.vm.$nextTick();

      expect(fetchMock).toHaveBeenCalledWith(
        "/api/test_data/export",
        expect.objectContaining({
          params: {
            format: "csv",
            filterColumn: "category",
            filterValues: "active,inactive",
          },
        }),
      );
    });

    it("calls export endpoint with recordId for a selected map feature", async () => {
      const wrapper = mount(DownloadMapData, {
        props: {
          dataForDownload: {
            type: "Feature",
            geometry: { type: "Point", coordinates: [-80, 43] },
            properties: { _id: "254137982", community: "other" },
          },
          exportRecordId: "254137982",
        },
        global: globalConfig,
      });

      const csvButton = wrapper.findAll("button")[0];
      await csvButton.trigger("click");
      await wrapper.vm.$nextTick();

      expect(fetchMock).toHaveBeenCalledWith(
        "/api/test_data/export",
        expect.objectContaining({
          params: {
            format: "csv",
            recordId: "254137982",
          },
        }),
      );
    });

    it("uses an explicit export table name when provided", async () => {
      const wrapper = mount(DownloadMapData, {
        props: {
          dataForDownload: {
            type: "Feature",
            geometry: { type: "Point", coordinates: [-80, 43] },
            properties: { _id: "254137982", community: "other" },
          },
          exportRecordId: "254137982",
          exportTableName: "mapeo_records",
        },
        global: globalConfig,
      });

      const csvButton = wrapper.findAll("button")[0];
      await csvButton.trigger("click");
      await wrapper.vm.$nextTick();

      expect(fetchMock).toHaveBeenCalledWith(
        "/api/mapeo_records/export",
        expect.objectContaining({
          params: {
            format: "csv",
            recordId: "254137982",
          },
        }),
      );
    });
  });
});
