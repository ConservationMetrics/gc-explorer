import { describe, it, expect, beforeEach, vi } from "vitest";
import { mount } from "@vue/test-utils";
import { ref, computed, watch, nextTick } from "vue";
import TimestampFilter from "@/components/shared/TimestampFilter.vue";
import type { Dataset } from "@/types";

Object.assign(globalThis, {
  ref,
  computed,
  watch,
  nextTick,
});

vi.mock("vue-3-slider-component", () => ({
  default: {
    name: "VueSlider",
    template: "<div></div>",
  },
}));

const mockT = (key: string) => key;

const globalConfig = {
  mocks: {
    $t: mockT,
  },
};

function mountFilter(data: Dataset, timestampColumn = "timestamp") {
  return mount(TimestampFilter, {
    props: { data, timestampColumn },
    global: globalConfig,
  });
}

describe("TimestampFilter component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders when data spans multiple months", () => {
    const wrapper = mountFilter([
      { id: "1", timestamp: "2024-01-15T12:00:00Z" },
      { id: "2", timestamp: "2024-03-01T12:00:00Z" },
    ] as Dataset);

    expect(wrapper.find('[data-testid="timestamp-filter"]').exists()).toBe(
      true,
    );
    expect(wrapper.find('[data-testid="date-slider"]').exists()).toBe(true);
  });

  it("hides when all dates fall in a single month", () => {
    const wrapper = mountFilter([
      { id: "1", timestamp: "2024-01-05T12:00:00Z" },
      { id: "2", timestamp: "2024-01-28T12:00:00Z" },
    ] as Dataset);

    expect(wrapper.find('[data-testid="timestamp-filter"]').exists()).toBe(
      false,
    );
  });

  it("hides when there are no valid dates", () => {
    const wrapper = mountFilter([
      { id: "1", timestamp: null },
      { id: "2", timestamp: "not-a-date" },
    ] as Dataset);

    expect(wrapper.find('[data-testid="timestamp-filter"]').exists()).toBe(
      false,
    );
  });

  it("does not emit a date range until the user moves the slider", async () => {
    const wrapper = mountFilter([
      { id: "1", timestamp: "2024-01-15T12:00:00Z" },
      { id: "2", timestamp: "2024-02-10T12:00:00Z" },
    ] as Dataset);

    await nextTick();

    expect(wrapper.emitted("filter")).toBeUndefined();
  });

  it("emits the selected range after the user moves the slider", async () => {
    const wrapper = mountFilter([
      { id: "1", timestamp: "2024-01-15T12:00:00Z" },
      { id: "2", timestamp: "2024-02-10T12:00:00Z" },
    ] as Dataset);

    await nextTick();

    const vm = wrapper.vm as unknown as {
      userInteracted: boolean;
      selectedRange: string[];
    };
    vm.userInteracted = true;
    vm.selectedRange = ["2024-02", "2024-02"];
    await nextTick();

    const filterEvents = wrapper.emitted("filter");
    expect(filterEvents).toBeTruthy();
    const [{ start, end }] = filterEvents![0] as [{ start: Date; end: Date }];
    expect(start.getFullYear()).toBe(2024);
    expect(start.getMonth()).toBe(1);
    expect(end.getFullYear()).toBe(2024);
    expect(end.getMonth()).toBe(1);
  });

  it("emits active true after the user narrows the range, then false on reset", async () => {
    const wrapper = mountFilter([
      { id: "1", timestamp: "2024-01-15T12:00:00Z" },
      { id: "2", timestamp: "2024-02-10T12:00:00Z" },
    ] as Dataset);

    await nextTick();
    expect(wrapper.emitted("active")).toBeUndefined();

    const vm = wrapper.vm as unknown as {
      userInteracted: boolean;
      selectedRange: string[];
      resetDateRange: () => void;
    };
    vm.userInteracted = true;
    vm.selectedRange = ["2024-02", "2024-02"];
    await nextTick();

    expect(wrapper.emitted("active")).toEqual([[true]]);

    vm.resetDateRange();
    await nextTick();

    expect(wrapper.emitted("active")?.at(-1)).toEqual([false]);
  });
});
