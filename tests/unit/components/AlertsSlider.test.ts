import { describe, expect, it } from "vitest";
import { mount } from "@vue/test-utils";
import {
  nextTick,
  onMounted,
  ref,
  watch,
  type ComponentPublicInstance,
} from "vue";
import AlertsSlider from "@/components/alerts/AlertsSlider.vue";

Object.assign(globalThis, { nextTick, onMounted, ref, watch });

describe("AlertsSlider controlled prototype range", () => {
  it("continues applying a drag after parent feedback and resets from clear", async () => {
    const wrapper = mount(AlertsSlider, {
      props: {
        dateOptions: ["01-2024", "02-2024", "03-2024"],
        showClearFilters: true,
      },
      global: {
        mocks: { $t: (key: string) => key },
      },
    });
    await nextTick();
    const slider =
      wrapper.getComponent<ComponentPublicInstance>(".date-slider");
    slider.vm.$emit("drag-start");
    slider.vm.$emit("update:modelValue", ["02-2024", "03-2024"]);
    await nextTick();
    await wrapper.setProps({ selectedDateRange: ["02-2024", "03-2024"] });
    slider.vm.$emit("update:modelValue", ["03-2024", "03-2024"]);
    await nextTick();
    expect(wrapper.emitted("date-range-changed")?.at(-1)).toEqual([
      ["03-2024", "03-2024"],
    ]);
    await wrapper.get("button").trigger("click");
    expect(wrapper.emitted("clear-filters")).toHaveLength(1);
    await wrapper.setProps({ selectedDateRange: undefined });
    expect(
      wrapper
        .findAll(".vue-slider-dot-tooltip-text")
        .map((tooltip) => tooltip.text()),
    ).toEqual(["01-2024", "03-2024"]);
    expect(wrapper.get("button").attributes("disabled")).toBeDefined();
    wrapper.unmount();
  });
});
