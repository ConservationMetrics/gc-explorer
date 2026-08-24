import { describe, it, expect, vi, beforeEach } from "vitest";
import { mount } from "@vue/test-utils";
import { computed, ref } from "vue";
import AlertsIntroPanel from "@/components/alerts/AlertsIntroPanel.vue";
import type { AlertsStatistics } from "@/types";

Object.assign(globalThis, { computed, ref });

const canManageConfig = ref(true);
vi.mock("@/composables/useCanManageConfig", () => ({
  useCanManageConfig: () => canManageConfig,
}));

vi.mock("@/components/shared/DownloadMapData.vue", () => ({
  default: { name: "DownloadMapData", template: "<div />" },
}));
vi.mock("@/components/shared/DownloadStatistics.vue", () => ({
  default: { name: "DownloadStatistics", template: "<div />" },
}));

const alertsStatistics: AlertsStatistics = {
  territory: "Malaita",
  typeOfAlerts: [],
  dataProviders: [],
  alertDetectionRange: "",
  allDates: [],
  earliestAlertsDate: "",
  recentAlertsDate: "",
  recentAlertsNumber: 0,
  alertsTotal: 0,
  alertsPerMonth: {},
  hectaresTotal: null,
  hectaresPerMonth: null,
  twelveMonthsBefore: "",
};

describe("AlertsIntroPanel", () => {
  beforeEach(() => {
    canManageConfig.value = true;
  });

  it("places the admin config gear next to the title", () => {
    const wrapper = mount(AlertsIntroPanel, {
      props: {
        alertsStatistics,
        tableName: "malaita_alerts",
      },
      global: {
        mocks: {
          $t: (key: string) => key,
          $n: (n: number) => String(n),
        },
        stubs: {
          AdminConfigGear: {
            props: ["tableName", "viewType"],
            template:
              '<a data-testid="admin-config-gear" :data-table-name="tableName" :data-view-type="viewType" />',
          },
          AlertsSlider: true,
          AlertsChart: true,
        },
      },
    });

    const gear = wrapper.get('[data-testid="admin-config-gear"]');
    expect(gear.attributes("data-table-name")).toBe("malaita_alerts");
    expect(gear.attributes("data-view-type")).toBe("alerts");
  });

  it("does not show the config gear when the user is not an admin", () => {
    canManageConfig.value = false;
    const wrapper = mount(AlertsIntroPanel, {
      props: {
        alertsStatistics,
        tableName: "malaita_alerts",
      },
      global: {
        mocks: {
          $t: (key: string) => key,
          $n: (n: number) => String(n),
        },
        stubs: {
          AdminConfigGear: false,
          NuxtLink: { template: "<a><slot /></a>" },
          AlertsSlider: true,
          AlertsChart: true,
        },
      },
    });

    expect(wrapper.find('[data-testid="admin-config-gear"]').exists()).toBe(
      false,
    );
  });
});
