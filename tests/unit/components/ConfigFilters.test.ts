import { describe, expect, it, vi } from "vitest";
import { mount } from "@vue/test-utils";
import { ref } from "vue";

import ConfigFilters from "@/components/config/ConfigFilters.vue";

Object.assign(globalThis, { ref });

vi.mock("@vojtechlanka/vue-tags-input", () => ({
  VueTagsInput: {
    name: "VueTagsInput",
    template: "<div />",
  },
}));

const mountConfigFilters = () =>
  mount(ConfigFilters, {
    props: {
      tableName: "alerts_table",
      config: {
        FRONT_END_FILTER_COLUMN: "status",
        SECONDARY_FILTER_VALUES: "active,pending",
      },
      views: ["alerts"],
      viewType: "alerts",
      hasSecondaryDataset: true,
      primaryColumns: [{ original_column: "_id", sql_column: "_id" }],
      secondaryColumns: [
        { original_column: "status", sql_column: "status" },
        { original_column: "status_type", sql_column: "status_type" },
      ],
      keys: ["FRONT_END_FILTER_COLUMN", "SECONDARY_FILTER_VALUES"],
    },
    global: {
      stubs: {
        VueTagsInput: {
          name: "VueTagsInput",
          props: ["tags", "autocompleteItems"],
          emits: ["tags-changed"],
          template:
            "<button data-testid=\"filter-values\" @click=\"$emit('tags-changed', [{ text: 'active' }])\" />",
        },
      },
      mocks: {
        $t: (key: string) => key,
      },
    },
  });

describe("ConfigFilters", () => {
  it("updates the filter column", async () => {
    const wrapper = mountConfigFilters();

    await wrapper
      .get<HTMLSelectElement>("#alerts_table-FRONT_END_FILTER_COLUMN")
      .setValue("status_type");

    expect(wrapper.emitted("updateConfig")?.[0]?.[0]).toEqual({
      FRONT_END_FILTER_COLUMN: "status_type",
    });
  });

  it("updates secondary include values", async () => {
    const wrapper = mountConfigFilters();

    await wrapper.get('[data-testid="filter-values"]').trigger("click");

    expect(wrapper.emitted("updateConfig")?.[0]?.[0]).toEqual({
      SECONDARY_FILTER_VALUES: "active",
    });
  });

  it("keeps tag fields full width of the grid", () => {
    const wrapper = mountConfigFilters();

    expect(wrapper.get(".tag-field").classes()).toContain("w-full");
    expect(
      wrapper.get(".tag-field").element.parentElement?.className,
    ).toContain("md:col-span-2");
  });

  it("associates tag field labels with the tag input", () => {
    const wrapper = mountConfigFilters();

    expect(
      wrapper.get('label[for="alerts_table-SECONDARY_FILTER_VALUES"]').text(),
    ).toBe("secondaryFilterValues");
    expect(
      wrapper.get("#alerts_table-SECONDARY_FILTER_VALUES").attributes("id"),
    ).toBe("alerts_table-SECONDARY_FILTER_VALUES");
  });

  it("excludes protected and active columns from unwanted suggestions", () => {
    const wrapper = mount(ConfigFilters, {
      props: {
        tableName: "survey_table",
        config: {
          COLOR_COLUMN: "status",
        },
        views: ["map"],
        viewType: "map",
        primaryColumns: [
          { original_column: "_id", sql_column: "_id" },
          { original_column: "Geometry", sql_column: "g__coordinates" },
          { original_column: "Status", sql_column: "status" },
          { original_column: "Photo", sql_column: "photo" },
        ],
        keys: ["UNWANTED_COLUMNS"],
      },
      global: {
        stubs: {
          VueTagsInput: {
            name: "VueTagsInput",
            props: ["tags", "autocompleteItems"],
            template: "<div />",
          },
        },
        mocks: {
          $t: (key: string) => key,
        },
      },
    });

    expect(
      wrapper.getComponent({ name: "VueTagsInput" }).props(),
    ).toMatchObject({
      autocompleteItems: [{ text: "Photo" }],
    });
  });

  it("shows an error when unwanted columns conflict with active fields", () => {
    const wrapper = mount(ConfigFilters, {
      props: {
        tableName: "survey_table",
        config: {
          COLOR_COLUMN: "status",
          UNWANTED_COLUMNS: "Status",
        },
        views: ["map"],
        viewType: "map",
        primaryColumns: [
          { original_column: "_id", sql_column: "_id" },
          { original_column: "Status", sql_column: "status" },
        ],
        keys: ["UNWANTED_COLUMNS"],
      },
      global: {
        stubs: {
          VueTagsInput: {
            name: "VueTagsInput",
            props: ["tags", "autocompleteItems"],
            template: "<div />",
          },
        },
        mocks: {
          $t: (key: string) => key,
        },
      },
    });

    expect(wrapper.get('[role="alert"]').text()).toBe("unwantedColumnsInvalid");
  });
});
