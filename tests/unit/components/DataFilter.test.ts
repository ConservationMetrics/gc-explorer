import { describe, it, expect, beforeEach, vi } from "vitest";
import { mount } from "@vue/test-utils";
import { ref, computed } from "vue";
import DataFilter from "@/components/shared/DataFilter.vue";
import type { Dataset } from "@/types";

Object.assign(globalThis, {
  ref,
  computed,
});

// Mock vue3-select-component
vi.mock("vue3-select-component", () => ({
  default: {
    name: "VueSelect",
    template: "<div></div>",
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
      category: "Camp",
      "filter-color": "#ff0000",
      color: "#B209B2",
    },
    {
      id: "2",
      category: "Water Source",
      "filter-color": "#00ff00",
      color: "#00A8FF",
    },
    {
      id: "3",
      category: "Camp",
      "filter-color": "#ff0000",
      color: "#B209B2",
    },
  ] as Dataset,
  filterColumn: "category",
  showColoredDot: true,
};

const globalConfig = {
  mocks: {
    $t: mockT,
  },
};

describe("DataFilter component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders filter component", () => {
    const wrapper = mount(DataFilter, {
      props: baseProps,
      global: globalConfig,
    });

    expect(wrapper.find('[data-testid="data-filter"]').exists()).toBe(true);
  });

  it("uses filter-color when colorColumn is not set", () => {
    const wrapper = mount(DataFilter, {
      props: baseProps,
      global: globalConfig,
    });

    const vm = wrapper.vm as unknown as {
      getUniqueFilterValues: Array<{
        label: string;
        value: string;
        color: string;
      }>;
    };

    const campEntry = vm.getUniqueFilterValues.find(
      (item) => item.value === "Camp",
    );
    expect(campEntry?.color).toBe("#ff0000");
  });

  it("uses colorColumn when specified", () => {
    const propsWithColorColumn = {
      ...baseProps,
      colorColumn: "color",
    };

    const wrapper = mount(DataFilter, {
      props: propsWithColorColumn,
      global: globalConfig,
    });

    const vm = wrapper.vm as unknown as {
      getUniqueFilterValues: Array<{
        label: string;
        value: string;
        color: string;
      }>;
    };

    const campEntry = vm.getUniqueFilterValues.find(
      (item) => item.value === "Camp",
    );
    expect(campEntry?.color).toBe("#B209B2");

    const waterSourceEntry = vm.getUniqueFilterValues.find(
      (item) => item.value === "Water Source",
    );
    expect(waterSourceEntry?.color).toBe("#00A8FF");
  });

  it("falls back to filter-color when colorColumn value is missing", () => {
    const dataWithMissingColor = [
      {
        id: "1",
        category: "Camp",
        "filter-color": "#ff0000",
        // No color field
      },
      {
        id: "2",
        category: "Water Source",
        "filter-color": "#00ff00",
        color: "#00A8FF",
      },
    ] as Dataset;

    const propsWithColorColumn = {
      ...baseProps,
      data: dataWithMissingColor,
      colorColumn: "color",
    };

    const wrapper = mount(DataFilter, {
      props: propsWithColorColumn,
      global: globalConfig,
    });

    const vm = wrapper.vm as unknown as {
      getUniqueFilterValues: Array<{
        label: string;
        value: string;
        color: string;
      }>;
    };

    const campEntry = vm.getUniqueFilterValues.find(
      (item) => item.value === "Camp",
    );
    // Should fall back to filter-color
    expect(campEntry?.color).toBe("#ff0000");

    const waterSourceEntry = vm.getUniqueFilterValues.find(
      (item) => item.value === "Water Source",
    );
    // Should use color column
    expect(waterSourceEntry?.color).toBe("#00A8FF");
  });

  it("uses default color when both colorColumn and filter-color are missing", () => {
    const dataWithoutColors = [
      {
        id: "1",
        category: "Camp",
        // No color or filter-color fields
      },
    ] as Dataset;

    const propsWithColorColumn = {
      ...baseProps,
      data: dataWithoutColors,
      colorColumn: "color",
    };

    const wrapper = mount(DataFilter, {
      props: propsWithColorColumn,
      global: globalConfig,
    });

    const vm = wrapper.vm as unknown as {
      getUniqueFilterValues: Array<{
        label: string;
        value: string;
        color: string;
      }>;
    };

    const campEntry = vm.getUniqueFilterValues.find(
      (item) => item.value === "Camp",
    );
    // Should use default color
    expect(campEntry?.color).toBe("#808080");
  });

  it("computes unique filter values correctly", () => {
    const wrapper = mount(DataFilter, {
      props: baseProps,
      global: globalConfig,
    });

    const vm = wrapper.vm as unknown as {
      getUniqueFilterValues: Array<{
        label: string;
        value: string;
        color: string;
      }>;
    };

    // Should have 2 unique values (Camp and Water Source)
    expect(vm.getUniqueFilterValues).toHaveLength(2);
  });

  it("emits selected values on option-selected", async () => {
    const wrapper = mount(DataFilter, {
      props: baseProps,
      global: globalConfig,
    });

    const vm = wrapper.vm as unknown as {
      selectedFilterValue: { value: string }[];
    };

    // Simulate what vue3-select-component does: mutate array then emit event
    vm.selectedFilterValue.push({ value: "Camp" });
    const vueSelect = wrapper.findComponent({ name: "VueSelect" });
    await vueSelect.vm.$emit("optionSelected", { value: "Camp" });

    const filterEvents = wrapper.emitted("filter")!;
    expect(filterEvents).toHaveLength(1);
    expect(filterEvents[0]).toEqual([[{ value: "Camp" }]]);
  });

  it("emits empty array on clear-all (not the string 'null')", async () => {
    const wrapper = mount(DataFilter, {
      props: baseProps,
      global: globalConfig,
    });

    const vm = wrapper.vm as unknown as {
      selectedFilterValue: { value: string }[];
    };

    // Select something first
    vm.selectedFilterValue.push({ value: "Camp" });
    const vueSelect = wrapper.findComponent({ name: "VueSelect" });
    await vueSelect.vm.$emit("optionSelected", { value: "Camp" });

    // Clear all: library replaces array with [] and emits optionDeselected(null)
    vm.selectedFilterValue.splice(0);
    await vueSelect.vm.$emit("optionDeselected", null);

    const filterEvents = wrapper.emitted("filter")!;
    expect(filterEvents).toHaveLength(2);
    expect(filterEvents[0]).toEqual([[{ value: "Camp" }]]);
    expect(filterEvents[1]).toEqual([[]]);
  });

  it("emits remaining values on option-deselected", async () => {
    const wrapper = mount(DataFilter, {
      props: baseProps,
      global: globalConfig,
    });

    const vm = wrapper.vm as unknown as {
      selectedFilterValue: { value: string }[];
    };
    const vueSelect = wrapper.findComponent({ name: "VueSelect" });

    // Select two
    vm.selectedFilterValue.push({ value: "Camp" }, { value: "Water Source" });
    await vueSelect.vm.$emit("optionSelected", { value: "Camp" });

    // Remove one (library uses .filter() which reassigns)
    vm.selectedFilterValue.splice(0, vm.selectedFilterValue.length, {
      value: "Water Source",
    });
    await vueSelect.vm.$emit("optionDeselected", { value: "Camp" });

    const filterEvents = wrapper.emitted("filter")!;
    expect(filterEvents).toHaveLength(2);
    expect(filterEvents[1]).toEqual([[{ value: "Water Source" }]]);
  });
});
