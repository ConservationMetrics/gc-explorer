import { describe, expect, it } from "vitest";
import { mount } from "@vue/test-utils";

import ConfigColumnSelect from "@/components/config/ConfigColumnSelect.vue";

const columns = [
  {
    original_column: "formhub/uuid",
    sql_column: "uuid__formhub",
  },
  {
    original_column: "status",
    sql_column: "status",
  },
];

const mountSelect = (modelValue = "") =>
  mount(ConfigColumnSelect, {
    props: {
      columns,
      id: "column-select",
      label: "Column",
      modelValue,
      placeholder: "Select a column",
    },
    global: {
      mocks: {
        $t: (key: string) => key,
      },
    },
  });

describe("ConfigColumnSelect", () => {
  it("uses SQL names as values and shows original names", () => {
    const wrapper = mountSelect();
    const options = wrapper.findAll("option");

    expect(options.map((option) => option.attributes("value"))).toEqual([
      "",
      "uuid__formhub",
      "status",
    ]);
    expect(options[1].text()).toBe("formhub/uuid (uuid__formhub)");
  });

  it("emits the selected SQL column", async () => {
    const wrapper = mountSelect();

    await wrapper.get("select").setValue("status");

    expect(wrapper.emitted("update:modelValue")?.[0]).toEqual(["status"]);
  });

  it("keeps an unavailable configured value visible with an error", () => {
    const wrapper = mountSelect("missing_column");

    expect(wrapper.get("select").attributes("aria-invalid")).toBe("true");
    expect(wrapper.get('[role="alert"]').text()).toBe("columnNotAvailable");
    expect(wrapper.get('option[value="missing_column"]').exists()).toBe(true);
  });
});
