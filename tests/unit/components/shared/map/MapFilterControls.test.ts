import { describe, expect, it, vi } from "vitest";
import { mount } from "@vue/test-utils";

import MapFilterControls from "@/components/shared/map/MapFilterControls.vue";

vi.mock("@/components/shared/filters/DataFilter.vue", () => ({
  default: {
    name: "DataFilter",
    props: ["filterColumn"],
    emits: ["filter"],
    template: `<div>
      <button data-testid="stub-data-filter" @click="$emit('filter', ['selected'])">{{ filterColumn }}</button>
      <button data-testid="stub-data-filter-clear" @click="$emit('filter', [])">clear</button>
    </div>`,
  },
}));

vi.mock("@/components/shared/filters/TimestampFilter.vue", () => ({
  default: {
    name: "TimestampFilter",
    emits: ["filter", "active"],
    template:
      "<button data-testid=\"stub-timestamp-filter\" @click=\"$emit('filter', { start: null, end: null }); $emit('active', true)\">date</button>",
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

  it("marks both filter buttons as applied at the same time (#685)", async () => {
    const wrapper = mount(MapFilterControls, {
      props: {
        data: [],
        filterColumn: "category",
        timestampColumn: "createdAt",
      },
      global: globalConfig,
    });

    const columnButton = wrapper.get('[data-testid="toggle-data-filter"]');
    const dateButton = wrapper.get('[data-testid="toggle-date-filter"]');

    expect(columnButton.attributes("aria-pressed")).toBe("false");
    expect(dateButton.attributes("aria-pressed")).toBe("false");
    expect(wrapper.find('[data-testid="column-filter-applied"]').exists()).toBe(
      false,
    );
    expect(wrapper.find('[data-testid="date-filter-applied"]').exists()).toBe(
      false,
    );

    await columnButton.trigger("click");
    await wrapper.get('[data-testid="stub-data-filter"]').trigger("click");
    await dateButton.trigger("click");
    await wrapper.get('[data-testid="stub-timestamp-filter"]').trigger("click");
    await columnButton.trigger("click");

    expect(columnButton.attributes("aria-pressed")).toBe("true");
    expect(dateButton.attributes("aria-pressed")).toBe("true");
    expect(wrapper.find('[data-testid="column-filter-applied"]').exists()).toBe(
      true,
    );
    expect(wrapper.find('[data-testid="date-filter-applied"]').exists()).toBe(
      true,
    );
    expect(columnButton.attributes("aria-expanded")).toBe("true");
    expect(dateButton.attributes("aria-expanded")).toBe("false");

    await columnButton.trigger("click");

    expect(columnButton.attributes("aria-expanded")).toBe("false");
    expect(dateButton.attributes("aria-expanded")).toBe("false");
    expect(columnButton.attributes("aria-pressed")).toBe("true");
    expect(dateButton.attributes("aria-pressed")).toBe("true");

    await columnButton.trigger("click");
    await wrapper
      .get('[data-testid="stub-data-filter-clear"]')
      .trigger("click");

    expect(columnButton.attributes("aria-pressed")).toBe("false");
    expect(dateButton.attributes("aria-pressed")).toBe("true");
    expect(wrapper.find('[data-testid="column-filter-applied"]').exists()).toBe(
      false,
    );
    expect(wrapper.find('[data-testid="date-filter-applied"]').exists()).toBe(
      true,
    );
  });

  it("emits copy-location from the location button", async () => {
    const wrapper = mount(MapFilterControls, {
      props: {
        data: [],
      },
      global: globalConfig,
    });

    await wrapper
      .get('[data-testid="copy-map-location-button"]')
      .trigger("click");
    expect(wrapper.emitted("copy-location")).toEqual([[]]);
  });
});
