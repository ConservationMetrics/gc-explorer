import { describe, expect, it } from "vitest";
import { mount } from "@vue/test-utils";
import { computed, ref, watch } from "vue";

import ConfigImagePreview from "@/components/config/ConfigImagePreview.vue";

Object.assign(globalThis, { computed, ref, watch });

const mountPreview = (props: {
  src: string;
  alt: string;
  fit?: "contain" | "cover";
}) =>
  mount(ConfigImagePreview, {
    props,
    global: {
      mocks: {
        $t: (key: string) => key,
      },
    },
  });

describe("ConfigImagePreview", () => {
  it("does not render for an empty source", () => {
    const wrapper = mountPreview({ src: "   ", alt: "Logo" });

    expect(wrapper.find("img").exists()).toBe(false);
    expect(wrapper.find("[data-testid='config-image-preview']").exists()).toBe(
      false,
    );
  });

  it("shows a contain preview after the image loads", async () => {
    const wrapper = mountPreview({
      src: "  https://example.test/logo.png  ",
      alt: "Logo",
    });

    await wrapper.get("img").trigger("load");

    const preview = wrapper.get("[data-testid='config-image-preview']");
    const image = preview.get("img");
    expect(image.attributes("src")).toBe("https://example.test/logo.png");
    expect(image.attributes("alt")).toBe("Logo");
    expect(image.classes()).toEqual(
      expect.arrayContaining(["max-h-28", "object-contain"]),
    );
  });

  it("uses a wide cover crop for header images", async () => {
    const wrapper = mountPreview({
      src: "https://example.test/header.jpg",
      alt: "Header",
      fit: "cover",
    });

    await wrapper.get("img").trigger("load");

    expect(
      wrapper.get("[data-testid='config-image-preview'] img").classes(),
    ).toEqual(expect.arrayContaining(["h-28", "w-full", "object-cover"]));
  });

  it("shows an error instead of a broken image", async () => {
    const wrapper = mountPreview({
      src: "https://example.test/missing.png",
      alt: "Missing image",
    });

    await wrapper.get("img").trigger("error");

    expect(
      wrapper.get("[data-testid='config-image-preview-error']").text(),
    ).toBe("imagePreviewLoadError");
    expect(wrapper.find("[data-testid='config-image-preview']").exists()).toBe(
      false,
    );
  });

  it("resets the preview when the source changes", async () => {
    const wrapper = mountPreview({
      src: "https://example.test/first.png",
      alt: "Logo",
    });

    await wrapper.get("img").trigger("load");
    expect(wrapper.find("[data-testid='config-image-preview']").exists()).toBe(
      true,
    );

    await wrapper.setProps({ src: "https://example.test/second.png" });

    expect(wrapper.find("[data-testid='config-image-preview']").exists()).toBe(
      false,
    );
    expect(wrapper.get("img").attributes("src")).toBe(
      "https://example.test/second.png",
    );
  });
});
