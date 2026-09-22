import { describe, expect, it } from "vitest";
import { mount } from "@vue/test-utils";

import CopyMapLocationButton from "@/components/shared/map/CopyMapLocationButton.vue";

const globalConfig = {
  mocks: {
    $t: (key: string) => key,
  },
};

describe("CopyMapLocationButton", () => {
  it("shows the location label until copy succeeds", () => {
    const wrapper = mount(CopyMapLocationButton, {
      props: { showCopied: false },
      global: globalConfig,
    });

    const button = wrapper.get('[data-testid="copy-map-location-button"]');
    expect(button.attributes("aria-label")).toBe("copyMapLocation");
    expect(wrapper.get('[role="tooltip"]').text()).toBe("copyMapLocation");
    expect(wrapper.get('[role="tooltip"]').classes()).not.toContain(
      "is-visible",
    );
  });

  it("keeps the copied tooltip visible after a successful copy", () => {
    const wrapper = mount(CopyMapLocationButton, {
      props: { showCopied: true },
      global: globalConfig,
    });

    const button = wrapper.get('[data-testid="copy-map-location-button"]');
    expect(button.attributes("aria-label")).toBe("copied");
    expect(wrapper.get('[role="tooltip"]').text()).toBe("copied");
    expect(wrapper.get('[role="tooltip"]').classes()).toContain("is-visible");
  });
});
