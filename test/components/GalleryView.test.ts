import { describe, it, expect, beforeEach, vi } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";
import { ref, computed, watch, onMounted, onBeforeUnmount } from "vue";
import GalleryView from "@/components/GalleryView.vue";
import type { Dataset } from "@/types/types";

Object.assign(globalThis, {
  ref,
  computed,
  watch,
  onMounted,
  onBeforeUnmount,
});

const baseProps = {
  allowedFileExtensions: {
    audio: [],
    image: ["jpg", "png"],
    video: [],
  },
  filterColumn: "status",
  galleryData: [
    {
      id: "1",
      name: "Feature 1",
      status: "active",
      geocoordinates: "[0, 0]",
      geotype: "Point",
      image: "photo1.jpg",
    },
    {
      id: "2",
      name: "Feature 2",
      status: "inactive",
      geocoordinates: "[1, 1]",
      geotype: "Point",
      image: "photo2.jpg",
    },
    {
      id: "3",
      name: "Feature 3",
      status: "active",
      geocoordinates: "[2, 2]",
      geotype: "Point",
      image: "photo3.jpg",
    },
  ] as Dataset,
  mediaBasePath: "/media",
};

const globalConfig = {
  mocks: {
    $t: (key: string) => key,
  },
  stubs: {
    DataFilter: true,
    TimestampFilter: true,
    DataFeature: true,
  },
};

describe("GalleryView component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders gallery container", () => {
    const wrapper = mount(GalleryView, {
      props: baseProps,
      global: globalConfig,
    });

    expect(wrapper.find('[data-testid="gallery-container"]').exists()).toBe(
      true,
    );
  });

  it("renders DataFilter when filterColumn is provided", () => {
    const wrapper = mount(GalleryView, {
      props: baseProps,
      global: {
        ...globalConfig,
        stubs: {
          ...globalConfig.stubs,
          DataFilter: false,
        },
      },
    });

    const dataFilter = wrapper.findComponent({ name: "DataFilter" });
    expect(dataFilter.exists()).toBe(true);
    expect(dataFilter.props("filterColumn")).toBe("status");
  });

  it("renders TimestampFilter when timestampColumn is provided", () => {
    const propsWithTimestamp = {
      ...baseProps,
      timestampColumn: "created_at",
      galleryData: [
        {
          ...baseProps.galleryData[0],
          created_at: "2024-01-15T10:00:00Z",
        },
        {
          ...baseProps.galleryData[1],
          created_at: "2024-06-20T14:30:00Z",
        },
      ] as Dataset,
    };

    const wrapper = mount(GalleryView, {
      props: propsWithTimestamp,
      global: {
        ...globalConfig,
        stubs: {
          ...globalConfig.stubs,
          TimestampFilter: false,
        },
      },
    });

    const timestampFilter = wrapper.findComponent({ name: "TimestampFilter" });
    expect(timestampFilter.exists()).toBe(true);
    expect(timestampFilter.props("timestampColumn")).toBe("created_at");
  });

  it("filters data by column values", async () => {
    const wrapper = mount(GalleryView, {
      props: baseProps,
      global: globalConfig,
    });

    const vm = wrapper.vm as unknown as {
      filteredData: Dataset;
      filterValues: (values: string[]) => void;
    };

    vm.filterValues(["active"]);
    await flushPromises();

    expect(vm.filteredData).toHaveLength(2);
    expect(vm.filteredData.every((item) => item.status === "active")).toBe(
      true,
    );
  });

  it("filters data by timestamp range", async () => {
    const propsWithTimestamp = {
      ...baseProps,
      timestampColumn: "created_at",
      galleryData: [
        {
          id: "1",
          name: "Feature 1",
          status: "active",
          geocoordinates: "[0, 0]",
          geotype: "Point",
          image: "photo1.jpg",
          created_at: "2024-01-15T10:00:00Z",
        },
        {
          id: "2",
          name: "Feature 2",
          status: "active",
          geocoordinates: "[1, 1]",
          geotype: "Point",
          image: "photo2.jpg",
          created_at: "2024-06-20T14:30:00Z",
        },
        {
          id: "3",
          name: "Feature 3",
          status: "active",
          geocoordinates: "[2, 2]",
          geotype: "Point",
          image: "photo3.jpg",
          created_at: "2024-12-01T08:00:00Z",
        },
      ] as Dataset,
    };

    const wrapper = mount(GalleryView, {
      props: propsWithTimestamp,
      global: globalConfig,
    });

    const vm = wrapper.vm as unknown as {
      filteredData: Dataset;
      filterByTimestamp: (range: {
        start: Date | null;
        end: Date | null;
      }) => void;
    };

    vm.filterByTimestamp({
      start: new Date("2024-03-01T00:00:00Z"),
      end: new Date("2024-10-31T23:59:59Z"),
    });
    await flushPromises();

    expect(vm.filteredData).toHaveLength(1);
    expect(vm.filteredData[0].id).toBe("2");
  });

  it("combines column filter and timestamp filter", async () => {
    const propsWithBothFilters = {
      ...baseProps,
      timestampColumn: "created_at",
      galleryData: [
        {
          id: "1",
          name: "Feature 1",
          status: "active",
          geocoordinates: "[0, 0]",
          geotype: "Point",
          image: "photo1.jpg",
          created_at: "2024-01-15T10:00:00Z",
        },
        {
          id: "2",
          name: "Feature 2",
          status: "inactive",
          geocoordinates: "[1, 1]",
          geotype: "Point",
          image: "photo2.jpg",
          created_at: "2024-06-20T14:30:00Z",
        },
        {
          id: "3",
          name: "Feature 3",
          status: "active",
          geocoordinates: "[2, 2]",
          geotype: "Point",
          image: "photo3.jpg",
          created_at: "2024-06-25T08:00:00Z",
        },
      ] as Dataset,
    };

    const wrapper = mount(GalleryView, {
      props: propsWithBothFilters,
      global: globalConfig,
    });

    const vm = wrapper.vm as unknown as {
      filteredData: Dataset;
      filterValues: (values: string[]) => void;
      filterByTimestamp: (range: {
        start: Date | null;
        end: Date | null;
      }) => void;
    };

    // Apply column filter for "active" status
    vm.filterValues(["active"]);
    await flushPromises();

    // Apply timestamp filter for June 2024
    vm.filterByTimestamp({
      start: new Date("2024-06-01T00:00:00Z"),
      end: new Date("2024-06-30T23:59:59Z"),
    });
    await flushPromises();

    // Should only include id: "3" (active AND in June)
    expect(vm.filteredData).toHaveLength(1);
    expect(vm.filteredData[0].id).toBe("3");
  });

  it("resets pagination when filters change", async () => {
    const wrapper = mount(GalleryView, {
      props: baseProps,
      global: globalConfig,
    });

    const vm = wrapper.vm as unknown as {
      currentPage: number;
      filterValues: (values: string[]) => void;
    };

    // Set page to something other than 1
    vm.currentPage = 3;
    await flushPromises();

    // Apply filter
    vm.filterValues(["active"]);
    await flushPromises();

    // Page should reset to 1
    expect(vm.currentPage).toBe(1);
  });

  it("shows all data when column filter is 'null'", async () => {
    const wrapper = mount(GalleryView, {
      props: baseProps,
      global: globalConfig,
    });

    const vm = wrapper.vm as unknown as {
      filteredData: Dataset;
      filterValues: (values: string[]) => void;
    };

    // First filter to active
    vm.filterValues(["active"]);
    await flushPromises();
    expect(vm.filteredData).toHaveLength(2);

    // Reset filter with "null"
    vm.filterValues(["null"]);
    await flushPromises();
    expect(vm.filteredData).toHaveLength(3);
  });

  it("handles invalid timestamp values gracefully", async () => {
    const propsWithInvalidTimestamps = {
      ...baseProps,
      timestampColumn: "created_at",
      galleryData: [
        {
          id: "1",
          name: "Feature 1",
          status: "active",
          geocoordinates: "[0, 0]",
          geotype: "Point",
          image: "photo1.jpg",
          created_at: "invalid-date",
        },
        {
          id: "2",
          name: "Feature 2",
          status: "active",
          geocoordinates: "[1, 1]",
          geotype: "Point",
          image: "photo2.jpg",
          created_at: "2024-06-20T14:30:00Z",
        },
        {
          id: "3",
          name: "Feature 3",
          status: "active",
          geocoordinates: "[2, 2]",
          geotype: "Point",
          image: "photo3.jpg",
          created_at: null,
        },
      ] as Dataset,
    };

    const wrapper = mount(GalleryView, {
      props: propsWithInvalidTimestamps,
      global: globalConfig,
    });

    const vm = wrapper.vm as unknown as {
      filteredData: Dataset;
      filterByTimestamp: (range: {
        start: Date | null;
        end: Date | null;
      }) => void;
    };

    vm.filterByTimestamp({
      start: new Date("2024-06-01T00:00:00Z"),
      end: new Date("2024-06-30T23:59:59Z"),
    });
    await flushPromises();

    // Should only include the item with valid timestamp
    expect(vm.filteredData).toHaveLength(1);
    expect(vm.filteredData[0].id).toBe("2");
  });
});

