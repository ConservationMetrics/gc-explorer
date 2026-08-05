import { mount } from "@vue/test-utils";
import { nextTick, onBeforeUnmount, ref, watch } from "vue";
import { describe, expect, it, afterEach } from "vitest";

import MediaImageModal from "@/components/shared/MediaImageModal.vue";

Object.assign(globalThis, { nextTick, onBeforeUnmount, ref, watch });

const globalConfig = {
  mocks: {
    $t: (key: string) => key,
  },
};

describe("MediaImageModal", () => {
  afterEach(() => {
    document.body.innerHTML = "";
    document.body.style.overflow = "";
  });

  it("renders image and caption when open", async () => {
    mount(MediaImageModal, {
      props: {
        open: true,
        imageUrl: "/media/field/photo.jpg",
        fileName: "photo.jpg",
      },
      global: globalConfig,
      attachTo: document.body,
    });

    await nextTick();

    const modal = document.querySelector('[data-testid="media-image-modal"]');
    expect(modal).toBeTruthy();
    const img = document.querySelector(
      '[data-testid="media-image-modal-image"]',
    ) as HTMLImageElement | null;
    expect(img?.getAttribute("src")).toBe("/media/field/photo.jpg");
    expect(
      document.querySelector('[data-testid="media-image-modal-caption"]')
        ?.textContent,
    ).toContain("photo.jpg");
  });

  it("emits close on backdrop click, close button, and Escape", async () => {
    const wrapper = mount(MediaImageModal, {
      props: {
        open: true,
        imageUrl: "/media/a.jpg",
        fileName: "a.jpg",
      },
      global: globalConfig,
      attachTo: document.body,
    });

    await nextTick();

    document
      .querySelector('[data-testid="media-image-modal-close"]')
      ?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    expect(wrapper.emitted("close")?.length).toBe(1);

    document.dispatchEvent(
      new KeyboardEvent("keydown", { key: "Escape", bubbles: true }),
    );
    expect(wrapper.emitted("close")?.length).toBe(2);

    document
      .querySelector('[data-testid="media-image-modal"]')
      ?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    expect(wrapper.emitted("close")?.length).toBe(3);
  });
});
