import { describe, expect, it, onTestFinished, vi } from "vitest";
import { flushPromises, mount } from "@vue/test-utils";
import { computed, defineComponent, onMounted, ref, watch } from "vue";
import VueSlider from "vue-3-slider-component";
import { useI18n, useRoute, useToast } from "#imports";
import AlertsIntroPanel from "@/components/alerts/AlertsIntroPanel.vue";
import DownloadMapData from "@/components/shared/DownloadMapData.vue";
import AlertsSlider from "@/components/alerts/AlertsSlider.vue";
import { useAlertsDateFilter } from "@/composables/useAlertsDateFilter";
import type { AlertsData, AlertsStatistics } from "@/types";

vi.mock("@/utils/browserDownload", () => ({ triggerBrowserDownload: vi.fn() }));

const statistics: AlertsStatistics = {
  territory: "Test Territory 645",
  typeOfAlerts: [],
  dataProviders: [],
  alertDetectionRange: "01-2024 to 03-2024",
  allDates: ["01-2024", "02-2024", "03-2024"],
  earliestAlertsDate: "01-2024",
  recentAlertsDate: "03-2024",
  recentAlertsNumber: 1,
  alertsTotal: 3,
  alertsPerMonth: {},
  hectaresTotal: null,
  hectaresPerMonth: null,
  twelveMonthsBefore: "03-2023",
};

for (const [buttonIndex, format] of ["csv", "geojson", "kml"].entries()) {
  describe(`${format} alert locations export`, () => {
    it("sends the sidebar slider's selected months to the export endpoint", async () => {
      const fetchExport = vi.fn().mockResolvedValue(new Blob());
      const originalRoute = useRoute();
      onTestFinished(() => {
        vi.unstubAllGlobals();
        vi.mocked(useRoute).mockReturnValue(originalRoute);
      });
      Object.entries({
        computed,
        ref,
        watch,
        onMounted,
        useI18n,
        useToast,
        $fetch: fetchExport,
      }).forEach(([name, value]) => vi.stubGlobal(name, value));
      vi.mocked(useRoute).mockReturnValue({
        params: { tablename: "test_data" },
        query: {},
        path: "/alerts/test_data",
      });
      const wrapper = mount(
        defineComponent({
          components: { AlertsIntroPanel },
          setup: () => {
            const data = ref<AlertsData>({
              mostRecentAlerts: { type: "FeatureCollection", features: [] },
              previousAlerts: {
                type: "FeatureCollection",
                features: ["202401", "202402", "202403"].map((month) => ({
                  type: "Feature",
                  geometry: { type: "Point", coordinates: [10, 20] },
                  properties: { YYYYMM: month },
                })),
              },
            });
            const { filteredData, resolvedDateRange, handleDateRangeChanged } =
              useAlertsDateFilter(
                ref(undefined),
                data,
                ref(statistics),
                ref(data.value),
                (key) => key,
              );
            return {
              data: filteredData,
              statistics,
              resolvedDateRange,
              handleDateRangeChanged,
            };
          },
          template: `<AlertsIntroPanel :alerts-statistics="statistics" :date-options="statistics.allDates" :data-for-alerts-intro-panel="data" :show-slider="true" :stats-export-min-date="resolvedDateRange?.[0]" :stats-export-max-date="resolvedDateRange?.[1]" @date-range-changed="handleDateRangeChanged" />`,
        }),
        {
          global: {
            components: { AlertsSlider },
            mocks: {
              $t: (key: string) => key,
              $n: (value: number) => value.toString(),
            },
            stubs: {
              AdminConfigGear: true,
              AlertsChart: true,
              DownloadStatistics: true,
            },
          },
        },
      );
      onTestFinished(() => wrapper.unmount());
      await flushPromises();
      const slider = wrapper.findComponent(VueSlider);
      slider.vm.$emit("drag-start");
      slider.vm.$emit("update:modelValue", ["02-2024", "02-2024"]);
      await flushPromises();
      expect(
        (
          wrapper
            .findComponent(DownloadMapData)
            .props("dataForDownload") as AlertsData
        ).previousAlerts.features,
      ).toHaveLength(1);
      const buttons = wrapper
        .get('[data-testid="alerts-download-data"]')
        .findAll("button");
      await buttons[buttonIndex].trigger("click");
      await flushPromises();
      expect(fetchExport).toHaveBeenLastCalledWith("/api/test_data/export", {
        params: {
          format,
          view_type: "alerts",
          minDate: "202402",
          maxDate: "202402",
        },
        responseType: "blob",
      });
    });
  });
}
