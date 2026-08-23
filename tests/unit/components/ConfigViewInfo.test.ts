import { describe, expect, it } from "vitest";
import { mount } from "@vue/test-utils";

import ConfigViewInfo from "@/components/config/ConfigViewInfo.vue";
import type { ViewConfig } from "@/types";

const viewKeys = [
  "DATASET_TABLE",
  "VIEW_DESCRIPTION",
  "VIEW_HEADER_IMAGE",
  "LOGO_URL",
];

const mountViewInfo = (views: string[] = ["alerts"]) =>
  mount(ConfigViewInfo, {
    props: {
      tableName: "test_table",
      config: {
        DATASET_TABLE: "Test View",
        VIEW_DESCRIPTION: "Test description",
        VIEW_HEADER_IMAGE: "https://example.test/header.jpg",
        LOGO_URL: "https://example.test/logo.png",
      } as ViewConfig,
      views,
      keys: viewKeys,
    },
    global: {
      stubs: {
        ConfigImagePreview: {
          props: ["src", "alt", "fit"],
          template:
            '<div data-testid="image-preview" :data-src="src" :data-fit="fit" />',
        },
      },
      mocks: {
        $t: (key: string) => key,
      },
    },
  });

describe("ConfigViewInfo", () => {
  it("renders display name, description, header image, and logo in order", () => {
    const wrapper = mountViewInfo();

    expect(
      wrapper.findAll("input, textarea").map((field) => field.attributes("id")),
    ).toEqual([
      "test_table-DATASET_TABLE",
      "test_table-VIEW_DESCRIPTION",
      "test_table-VIEW_HEADER_IMAGE",
      "test_table-LOGO_URL",
    ]);
  });

  it("gives display name and description the full grid width", () => {
    const wrapper = mountViewInfo();

    expect(
      wrapper.get("#test_table-DATASET_TABLE").element.parentElement?.className,
    ).toContain("md:col-span-2");
    expect(
      wrapper.get("#test_table-VIEW_DESCRIPTION").element.parentElement
        ?.className,
    ).toContain("md:col-span-2");
    expect(
      wrapper.get("#test_table-VIEW_HEADER_IMAGE").element.parentElement
        ?.className,
    ).not.toContain("md:col-span-2");
    expect(
      wrapper.get("#test_table-LOGO_URL").element.parentElement?.className,
    ).not.toContain("md:col-span-2");
  });

  it("uses cover for the header and contain for the logo preview", () => {
    const previews = mountViewInfo().findAll("[data-testid='image-preview']");

    expect(previews.map((preview) => preview.attributes("data-src"))).toEqual([
      "https://example.test/header.jpg",
      "https://example.test/logo.png",
    ]);
    expect(previews.map((preview) => preview.attributes("data-fit"))).toEqual([
      "cover",
      "contain",
    ]);
  });

  it("emits display name updates", async () => {
    const wrapper = mountViewInfo();

    await wrapper
      .get<HTMLInputElement>("#test_table-DATASET_TABLE")
      .setValue("Updated View");

    expect(wrapper.emitted("updateConfig")?.[0]?.[0]).toEqual({
      DATASET_TABLE: "Updated View",
    });
  });

  it.each(["alerts", "map"])("renders LOGO_URL when the view is %s", (view) => {
    const wrapper = mountViewInfo([view]);

    expect(wrapper.find("#test_table-LOGO_URL").exists()).toBe(true);
  });

  it("does not render LOGO_URL when the view is gallery", () => {
    const wrapper = mountViewInfo(["gallery"]);

    expect(wrapper.find("#test_table-LOGO_URL").exists()).toBe(false);
    expect(
      wrapper.findAll("input, textarea").map((field) => field.attributes("id")),
    ).toEqual([
      "test_table-DATASET_TABLE",
      "test_table-VIEW_DESCRIPTION",
      "test_table-VIEW_HEADER_IMAGE",
    ]);
  });
});
