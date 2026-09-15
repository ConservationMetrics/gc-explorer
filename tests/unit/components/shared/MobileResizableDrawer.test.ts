import { describe, expect, it } from "vitest";
import { mount } from "@vue/test-utils";
import { nextTick } from "vue";

import MobileResizableDrawer from "@/components/shared/MobileResizableDrawer.vue";

describe("MobileResizableDrawer", () => {
  it("starts at half the viewport height and supports keyboard resizing", async () => {
    Object.defineProperty(window, "innerHeight", {
      configurable: true,
      value: 800,
    });

    const wrapper = mount(MobileResizableDrawer, {
      props: { open: true },
    });
    await nextTick();
    const resizeHandle = wrapper.get('[role="separator"]');

    expect(resizeHandle.attributes("aria-valuenow")).toBe("400");
    expect(wrapper.emitted("height-change")?.at(-1)).toEqual([400]);

    await resizeHandle.trigger("keydown", { key: "ArrowUp" });
    expect(Number(resizeHandle.attributes("aria-valuenow"))).toBeGreaterThan(
      400,
    );

    await resizeHandle.trigger("keydown", { key: "End" });
    expect(resizeHandle.attributes("aria-valuenow")).toBe("200");

    await resizeHandle.trigger("keydown", { key: "Home" });
    expect(resizeHandle.attributes("aria-valuenow")).toBe("720");
  });
});
