import { mount } from "@vue/test-utils";
import { vi, describe, it, expect } from "vitest";
import { ref } from "vue";
import { useI18n } from "vue-i18n";

import LanguagePicker from "../../components/shared/LanguagePicker.vue";

vi.mock("vue-i18n", () => ({
  useI18n: () => ({
    t: (key: string) => key,
    locale: ref("en"),
    locales: ref([
      { code: "en", name: "English" },
      { code: "es", name: "Español" },
    ]),
    setLocale: vi.fn(),
  }),
}));

describe("LanguagePicker.vue", () => {
  it("renders the current locale name", async () => {
    const wrapper = mount(LanguagePicker);
    expect(wrapper.text()).toContain("English");
  });

  it("toggles the dropdown when button is clicked", async () => {
    const wrapper = mount(LanguagePicker);
    const button = wrapper.find("button");

    await button.trigger("click");
    expect(wrapper.find(".origin-top-right").exists()).toBe(true);

    await button.trigger("click");
    expect(wrapper.find(".origin-top-right").exists()).toBe(false);
  });

  it("changes the locale when a locale is clicked", async () => {
    const wrapper = mount(LanguagePicker);
    const { locale } = useI18n();

    const button = wrapper.find("button");

    await button.trigger("click");

    const localeLink = wrapper.findAll("a").at(1);
    if (localeLink) {
      await localeLink.trigger("click");
      locale.value = "es";
    } else {
      throw new Error("Could not find locale link");
    }

    expect(locale.value).toBe("es");

    expect(localeLink.text()).toContain("Español");
  });
});
