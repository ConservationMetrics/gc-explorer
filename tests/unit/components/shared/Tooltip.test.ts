import { describe, expect, it, vi } from "vitest";
import { mount } from "@vue/test-utils";
import { computed, ref } from "vue";

import Tooltip from "@/components/shared/Tooltip.vue";

Object.assign(globalThis, { computed, ref });

const setMobileViewport = (mobile: boolean) => {
  vi.spyOn(window, "matchMedia").mockImplementation(
    (query: string) =>
      ({
        matches: mobile && query === "(max-width: 639px)",
        media: query,
      }) as MediaQueryList,
  );
};

const openTooltip = async (mobile: boolean) => {
  setMobileViewport(mobile);
  const wrapper = mount(Tooltip, {
    props: { content: "Explain confidence", testId: "tip" },
  });
  await wrapper.find("svg").trigger("mouseenter");
  const tooltip = document.querySelector("[data-testid='tip']");
  return { tooltip, wrapper };
};

describe("Tooltip", () => {
  it("centers a phone tooltip in the viewport with a 10% side margin", async () => {
    const { tooltip, wrapper } = await openTooltip(true);

    expect(tooltip?.classList.contains("left-[10%]")).toBe(true);
    expect(tooltip?.classList.contains("right-[10%]")).toBe(true);
    expect(tooltip?.classList.contains("top-1/2")).toBe(true);
    expect(tooltip?.classList.contains("-translate-y-1/2")).toBe(true);
    expect((tooltip as HTMLElement).style.left).toBe("");
    expect((tooltip as HTMLElement).style.top).toBe("");

    wrapper.unmount();
  });

  it("anchors a wide-screen tooltip beside the icon", async () => {
    const { tooltip, wrapper } = await openTooltip(false);

    expect(tooltip?.classList.contains("w-80")).toBe(true);
    expect((tooltip as HTMLElement).style.left).toMatch(/px$/);
    expect((tooltip as HTMLElement).style.top).toMatch(/px$/);

    wrapper.unmount();
  });
});
