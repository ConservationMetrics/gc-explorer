import { describe, it, expect, vi, beforeEach } from "vitest";
import { mount } from "@vue/test-utils";
import { computed, ref, watch, onMounted, onBeforeUnmount } from "vue";

import GalleryView from "@/components/GalleryView.vue";
import type { AllowedFileExtensions, Dataset } from "@/types";

Object.assign(globalThis, {
  ref,
  computed,
  watch,
  onMounted,
  onBeforeUnmount,
});

const mockT = (key: string) => key;
vi.mock("vue-i18n", () => ({
  useI18n: () => ({ t: mockT }),
}));

vi.mock("@/composables/useRecordCache", () => ({
  useRecordCache: () => ({
    fetchRecords: vi.fn(async () => undefined),
    getCachedRecord: vi.fn(() => null),
    cacheSize: ref(0),
  }),
}));

const filterByDateAndCategoryMock = vi.fn((data: Dataset) => data);
const setDateRangeMock = vi.fn();
vi.mock("@/composables/useDateAndCategoryFilter", () => ({
  filterByDateAndCategory: (...args: unknown[]) =>
    filterByDateAndCategoryMock(...args),
  normalizeFilterValues: (v: unknown) => v,
  useTimestampFilter: () => ({
    dateMin: ref<Date | null>(null),
    dateMax: ref<Date | null>(null),
    setDateRange: setDateRangeMock,
  }),
}));

vi.mock("@/utils", () => ({
  getFilePathsWithExtension: () => ["photo.jpg"],
}));

vi.mock("@/utils/dataTransformers", () => ({
  transformSurveyEntry: (entry: unknown) => entry,
}));

vi.mock("@/utils/mapGLHelpers", () => ({
  prepareCoordinatesForSelectedFeature: (value: unknown) => value,
}));

const globalConfig = {
  mocks: { $t: mockT },
  stubs: {
    DataFilter: {
      props: ["data", "filterColumn"],
      template: `<button data-testid="stub-data-filter" @click="$emit('filter', ['x'])">filter</button>`,
    },
    TimestampFilter: {
      props: ["data", "timestampColumn"],
      template: `<button data-testid="stub-timestamp-filter" @click="$emit('filter', { start: new Date('2024-01-01'), end: new Date('2024-01-31') })">date</button>`,
    },
    GalleryGrid: {
      template: "<div data-testid='stub-gallery-grid'><slot /></div>",
    },
    GalleryTile: {
      props: ["testId", "suppressOverlay"],
      template: `<button type="button" :data-testid="testId" @click="$emit('open', $event)">tile</button>`,
    },
    GalleryDetailPanel: {
      template: '<div data-testid="gallery-detail-panel"></div>',
    },
    EmptyStateIllustration: {
      props: ["variant"],
      template:
        '<div data-testid="stub-empty-illustration">{{ variant }}</div>',
    },
  },
};

const baseProps = {
  allowedFileExtensions: {
    audio: [],
    image: ["jpg"],
    video: [],
  } satisfies AllowedFileExtensions,
  filterColumn: "",
  galleryData: [] as Dataset,
  mediaBasePath: "/",
  mediaColumn: "photo",
  table: "t",
};

describe("GalleryView empty states", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    filterByDateAndCategoryMock.mockReset();
    filterByDateAndCategoryMock.mockImplementation((data: Dataset) => data);
  });

  it("shows galleryEmpty when gallery has no items", () => {
    const wrapper = mount(GalleryView, {
      props: {
        ...baseProps,
        galleryData: [],
      },
      global: globalConfig,
    });

    const empty = wrapper.find('[data-testid="gallery-empty-state"]');
    expect(empty.exists()).toBe(true);
    expect(empty.text()).toContain("galleryEmpty");
    expect(wrapper.get('[data-testid="stub-empty-illustration"]').text()).toBe(
      "empty",
    );
  });

  it("shows galleryNoFilterResults when filters exclude all items", async () => {
    filterByDateAndCategoryMock.mockReturnValueOnce([]);

    const wrapper = mount(GalleryView, {
      props: {
        ...baseProps,
        filterColumn: "category",
        galleryData: [{ _id: "1", category: "a" }] as unknown as Dataset,
      },
      global: globalConfig,
    });

    await wrapper.get('[data-testid="stub-data-filter"]').trigger("click");

    const empty = wrapper.find('[data-testid="gallery-empty-state"]');
    expect(empty.exists()).toBe(true);
    expect(empty.text()).toContain("galleryNoFilterResults");
    expect(wrapper.get('[data-testid="stub-empty-illustration"]').text()).toBe(
      "noFilterResults",
    );
  });
});

describe("GalleryView filters", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    filterByDateAndCategoryMock.mockReset();
    filterByDateAndCategoryMock.mockImplementation((data: Dataset) => data);
  });

  const mountWithFilters = () =>
    mount(GalleryView, {
      props: {
        ...baseProps,
        filterColumn: "category",
        timestampColumn: "created_at",
        galleryData: [
          { _id: "1", category: "a", created_at: "2024-01-01" },
        ] as unknown as Dataset,
      },
      global: globalConfig,
    });

  it("renders an accessible filter panel toggle that is closed by default", async () => {
    const wrapper = mountWithFilters();
    const toggle = wrapper.get('[data-testid="filter-toggle"]');
    const panel = wrapper.get('[data-testid="filter-container"]');

    expect(toggle.attributes("aria-controls")).toBe("gallery-filter-panel");
    expect(toggle.attributes("aria-expanded")).toBe("false");
    expect(panel.attributes("style")).toContain("display: none");

    await toggle.trigger("click");

    expect(toggle.attributes("aria-expanded")).toBe("true");
    expect(panel.attributes("style")).not.toContain("display: none");
  });

  it("retains active filters when the panel is collapsed", async () => {
    const wrapper = mountWithFilters();
    const toggle = wrapper.get('[data-testid="filter-toggle"]');

    await toggle.trigger("click");
    await wrapper.get('[data-testid="stub-data-filter"]').trigger("click");
    await toggle.trigger("click");
    await toggle.trigger("click");

    expect(wrapper.get('[data-testid="stub-data-filter"]').exists()).toBe(true);
    expect(filterByDateAndCategoryMock).toHaveBeenLastCalledWith(
      expect.any(Array),
      expect.objectContaining({ selectedValues: ["x"] }),
    );
  });

  it("clears category and date filters and remounts both controls", async () => {
    const wrapper = mountWithFilters();

    await wrapper.get('[data-testid="filter-toggle"]').trigger("click");
    const dataFilter = wrapper.get('[data-testid="stub-data-filter"]').element;
    const timestampFilter = wrapper.get(
      '[data-testid="stub-timestamp-filter"]',
    ).element;
    await wrapper.get('[data-testid="stub-data-filter"]').trigger("click");
    await wrapper.get('[data-testid="clear-all-filters"]').trigger("click");

    expect(setDateRangeMock).toHaveBeenCalledWith({ start: null, end: null });
    expect(filterByDateAndCategoryMock).toHaveBeenLastCalledWith(
      expect.any(Array),
      expect.objectContaining({ selectedValues: [] }),
    );
    expect(wrapper.get('[data-testid="stub-data-filter"]').element).not.toBe(
      dataFilter,
    );
    expect(
      wrapper.get('[data-testid="stub-timestamp-filter"]').element,
    ).not.toBe(timestampFilter);
  });
});

describe("GalleryView grid rendering", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    filterByDateAndCategoryMock.mockReset();
    filterByDateAndCategoryMock.mockImplementation((data: Dataset) => data);
  });

  it("renders gallery tiles when filtered data is present", () => {
    const wrapper = mount(GalleryView, {
      props: {
        ...baseProps,
        galleryData: [{ _id: "1" }, { _id: "2" }] as unknown as Dataset,
      },
      global: globalConfig,
    });

    expect(wrapper.find('[data-testid="stub-gallery-grid"]').exists()).toBe(
      true,
    );
    expect(wrapper.find('[data-testid="gallery-item-0"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="gallery-item-1"]').exists()).toBe(true);
  });

  it("opens detail panel when a tile emits open", async () => {
    const wrapper = mount(GalleryView, {
      props: {
        ...baseProps,
        galleryData: [{ _id: "1" }] as unknown as Dataset,
      },
      global: globalConfig,
    });

    await wrapper.get('[data-testid="gallery-item-0"]').trigger("click");

    expect(wrapper.find('[data-testid="gallery-detail-panel"]').exists()).toBe(
      true,
    );
    expect(wrapper.find('[data-testid="gallery-item-0"]').exists()).toBe(false);
  });
});
