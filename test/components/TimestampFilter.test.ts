import { describe, it, expect, beforeEach, vi } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";
import { ref, computed, watch, onMounted, nextTick } from "vue";
import TimestampFilter from "@/components/shared/TimestampFilter.vue";
import type { Dataset } from "@/types/types";

Object.assign(globalThis, {
  ref,
  computed,
  watch,
  onMounted,
  nextTick,
});

// Mock vue-3-slider-component
vi.mock("vue-3-slider-component", () => ({
  default: {
    name: "VueSlider",
    template: '<div class="vue-slider"><slot /></div>',
    props: [
      "modelValue",
      "contained",
      "data",
      "height",
      "hideLabel",
      "marks",
      "tooltip",
      "tooltipPlacement",
    ],
    emits: ["update:modelValue", "drag-start"],
  },
}));

// Mock i18n
const mockT = (key: string) => key;
vi.mock("vue-i18n", () => ({
  useI18n: () => ({
    t: mockT,
  }),
}));

const baseProps = {
  data: [
    {
      id: "1",
      name: "Feature 1",
      timestamp: "2024-01-15T10:00:00Z",
    },
    {
      id: "2",
      name: "Feature 2",
      timestamp: "2024-06-20T14:30:00Z",
    },
    {
      id: "3",
      name: "Feature 3",
      timestamp: "2024-12-01T08:00:00Z",
    },
  ] as Dataset,
  timestampColumn: "timestamp",
};

const globalConfig = {
  mocks: {
    $t: mockT,
  },
};

describe("TimestampFilter component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders filter component", () => {
    const wrapper = mount(TimestampFilter, {
      props: baseProps,
      global: globalConfig,
    });

    expect(wrapper.find('[data-testid="timestamp-filter"]').exists()).toBe(
      true,
    );
  });

  it("displays the timestamp column name", () => {
    const wrapper = mount(TimestampFilter, {
      props: baseProps,
      global: globalConfig,
    });

    const heading = wrapper.find('[data-testid="filter-heading"]');
    expect(heading.text()).toContain("timestamp");
  });

  it("computes date options from dataset", () => {
    const wrapper = mount(TimestampFilter, {
      props: baseProps,
      global: globalConfig,
    });

    const vm = wrapper.vm as unknown as {
      dateInfo: {
        min: Date | null;
        max: Date | null;
        options: string[];
      };
    };

    expect(vm.dateInfo.min).toBeInstanceOf(Date);
    expect(vm.dateInfo.max).toBeInstanceOf(Date);
    expect(vm.dateInfo.min?.toISOString().split("T")[0]).toBe("2024-01-15");
    expect(vm.dateInfo.max?.toISOString().split("T")[0]).toBe("2024-12-01");
    expect(vm.dateInfo.options.length).toBeGreaterThan(0);
  });

  it("initializes slider with full range", async () => {
    const wrapper = mount(TimestampFilter, {
      props: baseProps,
      global: globalConfig,
    });

    await wrapper.vm.$nextTick();

    const vm = wrapper.vm as unknown as {
      selectedRange: string[];
      dateInfo: { options: string[] };
    };

    expect(vm.selectedRange).toHaveLength(2);
    expect(vm.selectedRange[0]).toBe(vm.dateInfo.options[0]);
    expect(vm.selectedRange[1]).toBe(
      vm.dateInfo.options[vm.dateInfo.options.length - 1],
    );
  });

  it("emits filter event on mount with full range", async () => {
    const wrapper = mount(TimestampFilter, {
      props: baseProps,
      global: globalConfig,
    });

    await flushPromises();
    // Wait for setTimeout in watch callback
    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(wrapper.emitted("filter")).toBeTruthy();
    const emittedFilter = wrapper.emitted("filter")?.[0]?.[0] as {
      start: Date | null;
      end: Date | null;
    };
    expect(emittedFilter?.start).toBeInstanceOf(Date);
    expect(emittedFilter?.end).toBeInstanceOf(Date);
  });

  it("emits filter event when slider range changes", async () => {
    const wrapper = mount(TimestampFilter, {
      props: baseProps,
      global: globalConfig,
    });

    await wrapper.vm.$nextTick();
    const initialEmitCount = wrapper.emitted("filter")?.length || 0;

    const vm = wrapper.vm as unknown as {
      selectedRange: string[];
      userInteracted: boolean;
    };

    // Simulate user interaction
    vm.userInteracted = true;
    vm.selectedRange = ["2024-03-01", "2024-10-01"];
    await wrapper.vm.$nextTick();

    expect(wrapper.emitted("filter")?.length).toBeGreaterThan(
      initialEmitCount,
    );
    const lastEmit = wrapper.emitted("filter")?.slice(-1)[0]?.[0] as {
      start: Date | null;
      end: Date | null;
    };
    expect(lastEmit.start?.toISOString().split("T")[0]).toBe("2024-03-01");
    expect(lastEmit.end?.toISOString().split("T")[0]).toBe("2024-10-01");
  });

  it("sets end date to end of day for inclusive filtering", async () => {
    const wrapper = mount(TimestampFilter, {
      props: baseProps,
      global: globalConfig,
    });

    await flushPromises();
    // Wait for setTimeout in watch callback
    await new Promise((resolve) => setTimeout(resolve, 10));

    const lastEmit = wrapper.emitted("filter")?.slice(-1)[0]?.[0] as {
      start: Date | null;
      end: Date | null;
    };

    expect(lastEmit?.end).toBeDefined();
    expect(lastEmit?.end?.getHours()).toBe(23);
    expect(lastEmit?.end?.getMinutes()).toBe(59);
    expect(lastEmit?.end?.getSeconds()).toBe(59);
  });

  it("resets to full range when reset button is clicked", async () => {
    const wrapper = mount(TimestampFilter, {
      props: baseProps,
      global: globalConfig,
    });

    await wrapper.vm.$nextTick();

    const vm = wrapper.vm as unknown as {
      selectedRange: string[];
      userInteracted: boolean;
      dateInfo: { options: string[] };
    };

    // Change the range
    vm.userInteracted = true;
    vm.selectedRange = ["2024-03-01", "2024-10-01"];
    await wrapper.vm.$nextTick();

    // Reset
    const resetButton = wrapper.find('[data-testid="reset-date-button"]');
    await resetButton.trigger("click");
    await wrapper.vm.$nextTick();

    expect(vm.selectedRange[0]).toBe(vm.dateInfo.options[0]);
    expect(vm.selectedRange[1]).toBe(
      vm.dateInfo.options[vm.dateInfo.options.length - 1],
    );
  });

  it("handles dataset with no valid dates", () => {
    const propsWithInvalidDates = {
      data: [
        {
          id: "1",
          name: "Feature 1",
          timestamp: "invalid-date",
        },
        {
          id: "2",
          name: "Feature 2",
          timestamp: null,
        },
      ] as Dataset,
      timestampColumn: "timestamp",
    };

    const wrapper = mount(TimestampFilter, {
      props: propsWithInvalidDates,
      global: globalConfig,
    });

    const vm = wrapper.vm as unknown as {
      dateInfo: {
        min: Date | null;
        max: Date | null;
        options: string[];
      };
    };

    expect(vm.dateInfo.min).toBeNull();
    expect(vm.dateInfo.max).toBeNull();
    expect(vm.dateInfo.options).toHaveLength(0);

    // Should show no data message
    expect(wrapper.find('[data-testid="no-data-message"]').exists()).toBe(true);
  });

  it("handles mixed valid and invalid dates", () => {
    const propsWithMixedDates = {
      data: [
        {
          id: "1",
          name: "Feature 1",
          timestamp: "invalid-date",
        },
        {
          id: "2",
          name: "Feature 2",
          timestamp: "2024-06-20T14:30:00Z",
        },
        {
          id: "3",
          name: "Feature 3",
          timestamp: null,
        },
      ] as Dataset,
      timestampColumn: "timestamp",
    };

    const wrapper = mount(TimestampFilter, {
      props: propsWithMixedDates,
      global: globalConfig,
    });

    const vm = wrapper.vm as unknown as {
      dateInfo: {
        min: Date | null;
        max: Date | null;
        options: string[];
      };
    };

    expect(vm.dateInfo.min).toBeInstanceOf(Date);
    expect(vm.dateInfo.max).toBeInstanceOf(Date);
    expect(vm.dateInfo.min?.toISOString().split("T")[0]).toBe("2024-06-20");
    expect(vm.dateInfo.max?.toISOString().split("T")[0]).toBe("2024-06-20");
    expect(vm.dateInfo.options).toHaveLength(1);
  });
});

