import { describe, expect, it, vi } from "vitest";
import { mount } from "@vue/test-utils";

import MapFilterControls from "@/components/shared/MapFilterControls.vue";

vi.mock("@/components/shared/DataFilter.vue", () => ({
  default: {
    name: "DataFilter",
    props: ["filterColumn"],
    emits: ["filter"],
    template:
      "<button data-testid=\"stub-data-filter\" @click=\"$emit('filter', ['selected'])\">{{ filterColumn }}</button>",
  },
}));

vi.mock("@/components/shared/TimestampFilter.vue", () => ({
  default: {
    name: "TimestampFilter",
    emits: ["filter"],
    template:
      '<button data-testid="stub-timestamp-filter" @click="$emit(\'filter\', { start: null, end: null })">date</button>',
  },
}));

const globalConfig = {
  mocks: {
    $t: (key: string) => key,
  },
};

describe("MapFilterControls", () => {
  it("toggles filter panels and emits their selections", async () => {
    const wrapper = mount(MapFilterControls, {
      props: {
        data: [],
        filterColumn: "category",
        timestampColumn: "createdAt",
      },
      global: globalConfig,
    });

    await wrapper.get('[data-testid="toggle-data-filter"]').trigger("click");
    expect(wrapper.find('[data-testid="stub-data-filter"]').exists()).toBe(
      true,
    );
    expect(
      wrapper
        .get('[data-testid="data-filter-panel"]')
        .attributes("aria-hidden"),
    ).toBe("false");
    expect(wrapper.find('[data-testid="stub-timestamp-filter"]').exists()).toBe(
      false,
    );

    await wrapper.get('[data-testid="stub-data-filter"]').trigger("click");
    expect(wrapper.emitted("filter")).toEqual([[["selected"]]]);

    await wrapper.get('[data-testid="toggle-date-filter"]').trigger("click");
    expect(wrapper.find('[data-testid="stub-data-filter"]').exists()).toBe(
      true,
    );
    expect(
      wrapper
        .get('[data-testid="data-filter-panel"]')
        .attributes("aria-hidden"),
    ).toBe("true");
    expect(wrapper.find('[data-testid="stub-timestamp-filter"]').exists()).toBe(
      true,
    );
    expect(
      wrapper
        .get('[data-testid="date-filter-panel"]')
        .attributes("aria-hidden"),
    ).toBe("false");

    await wrapper.get('[data-testid="stub-timestamp-filter"]').trigger("click");
    expect(wrapper.emitted("date-filter")).toEqual([
      [{ start: null, end: null }],
    ]);
  });

  it("keeps both filter panels mounted after switching between them", async () => {
    const wrapper = mount(MapFilterControls, {
      props: {
        data: [],
        filterColumn: "category",
        timestampColumn: "createdAt",
      },
      global: globalConfig,
    });

    await wrapper.get('[data-testid="toggle-date-filter"]').trigger("click");
    await wrapper.get('[data-testid="toggle-data-filter"]').trigger("click");
    await wrapper.get('[data-testid="toggle-date-filter"]').trigger("click");

    expect(wrapper.find('[data-testid="stub-data-filter"]').exists()).toBe(
      true,
    );
    expect(wrapper.find('[data-testid="stub-timestamp-filter"]').exists()).toBe(
      true,
    );
    expect(
      wrapper
        .get('[data-testid="data-filter-panel"]')
        .attributes("aria-hidden"),
    ).toBe("true");
    expect(
      wrapper
        .get('[data-testid="date-filter-panel"]')
        .attributes("aria-hidden"),
    ).toBe("false");
  });
});
