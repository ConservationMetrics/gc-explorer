import { describe, expect, it, vi } from "vitest";
import { mount } from "@vue/test-utils";
import { onMounted, ref, watch } from "vue";
import AlertsSlider from "@/components/alerts/AlertsSlider.vue";

Object.assign(globalThis, { onMounted, ref, watch });

vi.mock("vue-3-slider-component", () => ({
  default: {
    name: "VueSlider",
    props: ["processStyle"],
    template: "<div />",
  },
}));

describe("AlertsSlider", () => {
  it("uses the violet process color", () => {
    const wrapper = mount(AlertsSlider, {
      props: {
        dateOptions: ["2024-01", "2024-02"],
      },
      global: {
        mocks: {
          $t: (key: string) => key,
        },
      },
    });

    expect(
      wrapper.findComponent({ name: "VueSlider" }).props("processStyle"),
    ).toEqual({ backgroundColor: "#7c3aed" });
  });
});
