import { describe, it, expect, beforeEach, vi } from "vitest";
import { mount } from "@vue/test-utils";
import { ref, computed } from "vue";
import DownloadMapData from "@/components/shared/downloads/DownloadMapData.vue";
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

    it("shows GeoJSON as the default download and hides alternate formats", () => {
      const wrapper = mount(DownloadMapData, {
        props: {
          dataForDownload: simpleFeatureCollection,
        },
        global: globalConfig,
      });

      expect(wrapper.get('[data-testid="download-default"]').text()).toContain(
        "downloadGeoJSON",
      );
      expect(wrapper.find('[data-testid="download-menu"]').exists()).toBe(
        false,
      );
    });

    it("shows CSV and KML in the format menu", async () => {
      const wrapper = mount(DownloadMapData, {
        props: {
          dataForDownload: simpleFeatureCollection,
        },
        global: globalConfig,
      });

      await wrapper
        .get('[data-testid="download-menu-trigger"]')
        .trigger("click");

      const menu = wrapper.get('[data-testid="download-menu"]');
      const items = menu.findAll("button");
      expect(items).toHaveLength(2);
      expect(items[0].text()).toContain("downloadCSV");
      expect(items[1].text()).toContain("downloadKML");
    });

    it("opens the format menu upward when requested", async () => {
      const wrapper = mount(DownloadMapData, {
        props: {
          dataForDownload: simpleFeatureCollection,
          menuPlacement: "top",
        },
        global: globalConfig,
      });

      await wrapper
        .get('[data-testid="download-menu-trigger"]')
        .trigger("click");

      expect(wrapper.get('[data-testid="download-menu"]').classes()).toContain(
        "bottom-full",
      );
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

      const defaultButton = wrapper.get('[data-testid="download-default"]');
      expect(defaultButton.classes()).toContain("bg-blue-500");
      expect(defaultButton.classes()).toContain("text-white");
      expect(defaultButton.classes()).toContain("hover:bg-blue-600");
    });

    it("should render outline buttons when variant is outline", () => {
      const wrapper = mount(DownloadMapData, {
        props: {
          dataForDownload: simpleFeatureCollection,
          variant: "outline",
        },
        global: globalConfig,
      });

      const defaultButton = wrapper.get('[data-testid="download-default"]');
      expect(defaultButton.classes()).toContain("border-blue-500");
      expect(defaultButton.classes()).toContain("bg-white");
      expect(defaultButton.classes()).not.toContain("bg-blue-500");
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

    it("downloads GeoJSON from the primary action", async () => {
      const wrapper = mount(DownloadMapData, {
        props: {
          dataForDownload: simpleFeatureCollection,
        },
        global: globalConfig,
      });

      await wrapper.get('[data-testid="download-default"]').trigger("click");

      expect(fetchMock).toHaveBeenCalledWith(
        "/api/test_data/export",
        expect.objectContaining({ params: { format: "geojson" } }),
      );
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

      await wrapper
        .get('[data-testid="download-menu-trigger"]')
        .trigger("click");
      const csvButton = wrapper.get('[data-testid="download-csv"]');
      await csvButton.trigger("click");
      await wrapper.vm.$nextTick();

      expect(wrapper.find('[data-testid="download-menu"]').exists()).toBe(
        false,
      );

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

      await wrapper
        .get('[data-testid="download-menu-trigger"]')
        .trigger("click");
      const csvButton = wrapper.get('[data-testid="download-csv"]');
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

      await wrapper
        .get('[data-testid="download-menu-trigger"]')
        .trigger("click");
      const csvButton = wrapper.get('[data-testid="download-csv"]');
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
