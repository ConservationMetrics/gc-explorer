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
    template: `<div>
      <button data-testid="stub-timestamp-filter" @click="$emit('filter', { start: null, end: null }); $emit('active', true)">date</button>
      <button data-testid="stub-timestamp-filter-clear" @click="$emit('active', false)">clear date</button>
    </div>`,
  },
}));

const globalConfig = {
  mocks: {
    $t: (key: string) => key,
  },
};

describe("MapFilterControls", () => {
  it("opens one pane with both filters and emits their selections (#703)", async () => {
    const wrapper = mount(MapFilterControls, {
      props: {
        data: [],
        filterColumn: "category",
        timestampColumn: "createdAt",
      },
      global: globalConfig,
    });

    const toggle = wrapper.get('[data-testid="toggle-filters"]');
    expect(toggle.attributes("aria-expanded")).toBe("false");
    expect(wrapper.find('[data-testid="filters-panel"]').exists()).toBe(false);

    await toggle.trigger("click");
    expect(toggle.attributes("aria-expanded")).toBe("true");
    expect(
      wrapper.get('[data-testid="filters-panel"]').attributes("aria-hidden"),
    ).toBe("false");
    expect(wrapper.find('[data-testid="stub-data-filter"]').exists()).toBe(
      true,
    );
    expect(wrapper.find('[data-testid="stub-timestamp-filter"]').exists()).toBe(
      true,
    );

    await wrapper.get('[data-testid="stub-data-filter"]').trigger("click");
    await wrapper.get('[data-testid="stub-timestamp-filter"]').trigger("click");
    expect(wrapper.emitted("filter")).toEqual([[["selected"]]]);
    expect(wrapper.emitted("date-filter")).toEqual([
      [{ start: null, end: null }],
    ]);

    await toggle.trigger("click");
    expect(toggle.attributes("aria-expanded")).toBe("false");
    expect(
      wrapper.get('[data-testid="filters-panel"]').attributes("aria-hidden"),
    ).toBe("true");
    expect(wrapper.find('[data-testid="stub-data-filter"]').exists()).toBe(
      true,
    );
    expect(wrapper.find('[data-testid="stub-timestamp-filter"]').exists()).toBe(
      true,
    );
  });

  it("shows only the filters the view is configured for", async () => {
    const wrapper = mount(MapFilterControls, {
      props: {
        data: [],
        timestampColumn: "createdAt",
      },
      global: globalConfig,
    });

    await wrapper.get('[data-testid="toggle-filters"]').trigger("click");
    expect(wrapper.find('[data-testid="stub-timestamp-filter"]').exists()).toBe(
      true,
    );
    expect(wrapper.find('[data-testid="stub-data-filter"]').exists()).toBe(
      false,
    );
  });

  it("hides the filter button when no filter is configured", () => {
    const wrapper = mount(MapFilterControls, {
      props: { data: [] },
      global: globalConfig,
    });

    expect(wrapper.find('[data-testid="toggle-filters"]').exists()).toBe(false);
  });

  it("marks the filter button as applied while either filter is applied", async () => {
    const wrapper = mount(MapFilterControls, {
      props: {
        data: [],
        filterColumn: "category",
        timestampColumn: "createdAt",
      },
      global: globalConfig,
    });

    const toggle = wrapper.get('[data-testid="toggle-filters"]');
    const applied = () =>
      wrapper.find('[data-testid="filters-applied"]').exists();

    expect(toggle.attributes("aria-pressed")).toBe("false");
    expect(applied()).toBe(false);

    await toggle.trigger("click");
    await wrapper.get('[data-testid="stub-data-filter"]').trigger("click");
    await wrapper.get('[data-testid="stub-timestamp-filter"]').trigger("click");
    expect(toggle.attributes("aria-pressed")).toBe("true");
    expect(applied()).toBe(true);

    await wrapper
      .get('[data-testid="stub-data-filter-clear"]')
      .trigger("click");
    expect(toggle.attributes("aria-pressed")).toBe("true");
    expect(applied()).toBe(true);

    await toggle.trigger("click");
    expect(toggle.attributes("aria-pressed")).toBe("true");

    await toggle.trigger("click");
    await wrapper
      .get('[data-testid="stub-timestamp-filter-clear"]')
      .trigger("click");
    expect(toggle.attributes("aria-pressed")).toBe("false");
    expect(applied()).toBe(false);
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
