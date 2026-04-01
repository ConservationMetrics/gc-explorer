import { describe, it, expect, beforeEach, vi } from "vitest";
import { mount } from "@vue/test-utils";
import { ref } from "vue";

const mocks = vi.hoisted(() => ({
  downloadTableExport: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/composables/useTableExportDownload", () => ({
  useTableExportDownload: () => ({
    downloadTableExport: mocks.downloadTableExport,
    getTablename: () => "test_data",
  }),
}));

import DownloadStatistics from "@/components/shared/DownloadStatistics.vue";

Object.assign(globalThis, {
  ref,
});

const mockT = (key: string) => key;
const mockUseI18n = () => ({ t: mockT });

vi.mock("vue-i18n", () => ({
  useI18n: mockUseI18n,
}));

const globalConfig = {
  mocks: {
    $t: mockT,
  },
};

describe("DownloadStatistics component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders a single Download statistics button", () => {
    const wrapper = mount(DownloadStatistics, {
      global: globalConfig,
    });

    const buttons = wrapper.findAll("button");
    expect(buttons.length).toBe(1);
    expect(buttons[0].text()).toContain("downloadStatistics");
  });

  it("calls statistics export with min/max dates when provided", async () => {
    const wrapper = mount(DownloadStatistics, {
      props: {
        minDate: "202401",
        maxDate: "202403",
        filenamePrefix: "statistics",
      },
      global: globalConfig,
    });

    await wrapper.find("button").trigger("click");
    await wrapper.vm.$nextTick();

    expect(mocks.downloadTableExport).toHaveBeenCalledWith({
      exportPath: "statistics-export",
      format: "csv",
      exportMinDate: "202401",
      exportMaxDate: "202403",
      filenamePrefix: "statistics",
    });
  });
});
