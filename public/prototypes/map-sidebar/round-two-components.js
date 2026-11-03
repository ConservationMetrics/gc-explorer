const translations = {
  alertsLast12Months: "Alerts in the last 12 months",
  alertDetectionRange: "Alert detection range",
  alerts: "Alerts",
  alertsTotal: "Total number of alerts",
  andPreviousAlertsShownIn: "and previous alerts shown in",
  changeDetectionAlerts: "Change Detection Alerts",
  clickOnAlertsForMoreInfo: "Click on alerts for more information",
  dataProviders: "Data provider(s)",
  downloadAlertLocations: "Alert locations",
  downloadAlertLocationsDescription:
    "Alerts shown on the map for the selected date range.",
  downloadData: "Download data",
  downloadMonthlySummary: "Monthly summary",
  downloadMonthlySummaryDescription:
    "Monthly counts for the selected date range.",
  hectaresTotal: "Total number of hectares affected",
  mostRecentAlertsShownIn: "Most recent alerts shown on map in",
  numberOfAlerts: "Number of alerts",
  orange: "orange",
  recentAlertsDate: "Date of most recent alerts published",
  recentAlertsNumber: "Number of most recent alerts",
  red: "red",
  selectAlertDateRange: "Select an alert date range",
  statistics: "Statistics",
  typeOfAlerts: "Type of alerts",
};
const CurrentSlider = {
  components: { VueSlider: window.index.default },
  props: ["dateOptions", "initialRange"],
  emits: ["date-range-changed", "clear-filters"],
  setup: (props, { emit }) => {
    const selectedRange = computed({
      get: () => props.initialRange,
      set: (value) => emit("date-range-changed", value),
    });
    const rangeActive = computed(
      () =>
        props.initialRange[0] !== "2026-07" ||
        props.initialRange[1] !== "2026-10",
    );
    return { selectedRange, rangeActive, emit };
  },
  template:
    '\n  <div>\n    <h3 class="text-2xl font-semibold tracking-tight mb-3">\n      {{ $t("selectAlertDateRange") }}\n    </h3>\n    <div class="mb-8">\n      <VueSlider\n        v-model="selectedRange"\n        class="date-slider" :dot-attrs="{ \'aria-label\': \'Alert date range handle\' }" :enable-cross="false"\n        :contained="true"\n        :data="dateOptions"\n        :height="8"\n        :hide-label="true"\n        :marks="true"\n        :process-style="{ backgroundColor: \'#7c3aed\' }"\n        :tooltip="\'always\'"\n        :tooltip-placement="\'bottom\'"\n        aria-label="Alert date range"\n      />\n    </div>\n    <div class="flex justify-end"><button class="clear-filters" :disabled="!rangeActive" @click="emit(\'clear-filters\')">Clear filters</button></div>\n  </div>\n',
};
const CurrentChart = {
  props: ["alertsStatistics"],
  setup: (props) => {
    const canvas = ref();
    let chart;
    onMounted(() => {
      chart = new Chart(canvas.value, {
        type: "line",
        data: {
          labels: Object.keys(props.alertsStatistics.alertsPerMonth),
          datasets: [
            {
              backgroundColor: "rgba(0,0,0,0)",
              borderColor: "#f87979",
              data: Object.values(props.alertsStatistics.alertsPerMonth),
              fill: false,
              label: translations.numberOfAlerts,
              pointBackgroundColor: "#f87979",
            },
          ],
        },
        options: { animation: false },
      });
    });
    watch(
      () => props.alertsStatistics.alertsPerMonth,
      (value) => {
        if (chart) {
          chart.data.labels = Object.keys(value);
          chart.data.datasets[0].data = Object.values(value);
          chart.update("none");
        }
      },
    );
    onBeforeUnmount(() => chart?.destroy());
    return { canvas };
  },
  template:
    '<div class="mt-4"><h3 class="text-2xl font-semibold mb-2">{{$t("alertsLast12Months")}}</h3><div class="mb-2"><canvas ref="canvas" aria-label="Synthetic monthly alert counts" role="img"></canvas></div></div>',
};
const CurrentDownload = {
  components: { Icon },
  emits: ["download"],
  template:
    '<button class="control primary mx-auto mt-2" @click="$emit(\'download\')"><Icon name="Download" :size="18"/>Download <Icon name="ChevronDown" :size="16"/></button>',
};
const CurrentPanel = {
  components: {
    AlertsSlider: CurrentSlider,
    AlertsChart: CurrentChart,
    DownloadMapData: CurrentDownload,
    DownloadStatistics: CurrentDownload,
    AdminConfigGear: { template: "<span></span>" },
  },
  props: ["alertsStatistics", "initialRange"],
  emits: [
    "date-range-changed",
    "download",
    "download-summary",
    "clear-filters",
  ],
  setup: (properties, { emit }) => {
    const props = computed(() => ({
      alertsStatistics: properties.alertsStatistics,
      dateOptions: ["2026-07", "2026-08", "2026-09", "2026-10"],
      showSlider: true,
      initialRange: properties.initialRange,
      dataForAlertsIntroPanel: {},
      calculateHectares: false,
    }));
    const showDownloads = ref(true);
    return { props, showDownloads, emit };
  },
  template:
    '\n  <div class="space-y-4" data-testid="alerts-intro-panel">\n    <div\n      class="rounded-2xl border border-violet-100 bg-violet-50 text-card-foreground shadow-sm"\n      data-testid="alerts-intro-header"\n    >\n      <div class="p-6 space-y-4">\n        <img\n          v-if="props.logoUrl"\n          :src="props.logoUrl"\n          class="w-auto mx-auto mb-4 max-h-25"\n          alt="Logo"\n          loading="eager"\n        />\n        <div class="flex items-center gap-2 pr-10">\n          <h2 class="text-2xl font-semibold tracking-tight min-w-0">\n            {{ $t("changeDetectionAlerts")\n            }}<span\n              v-if="props.alertsStatistics.territory"\n              class="text-muted-foreground"\n              >: {{ props.alertsStatistics.territory }}</span\n            >\n          </h2>\n          <AdminConfigGear\n            v-if="tableName"\n            :table-name="tableName"\n            view-type="alerts"\n          />\n        </div>\n        <div\n          v-if="props.alertsStatistics.alertsTotal > 0"\n          class="space-y-2 text-sm text-muted-foreground"\n        >\n          <p class="italic">\n            {{ $t("mostRecentAlertsShownIn") }}\n            <span class="text-red-500 font-bold">{{ $t("red") }}</span\n            >,\n            {{ $t("andPreviousAlertsShownIn") }}\n            <span class="text-orange-500 font-bold">{{ $t("orange") }}</span\n            >.\n          </p>\n          <p class="italic">{{ $t("clickOnAlertsForMoreInfo") }}.</p>\n        </div>\n        <div\n          v-if="props.showSlider"\n          data-testid="alerts-date-range"\n          class="pt-2"\n        >\n          <AlertsSlider\n            :date-options="props.dateOptions" :initial-range="props.initialRange"\n            @date-range-changed="emit(\'date-range-changed\', $event)" @clear-filters="emit(\'clear-filters\')"\n          />\n        </div>\n      </div>\n    </div>\n\n    <div\n      class="rounded-2xl border border-violet-100 bg-violet-50 text-card-foreground shadow-sm"\n      data-testid="alerts-statistics"\n    >\n      <div class="p-6 space-y-4">\n        <h3 class="text-2xl font-semibold tracking-tight">\n          {{ $t("statistics") }}\n        </h3>\n        <div class="space-y-2 text-sm">\n          <p v-if="props.alertsStatistics.typeOfAlerts?.length">\n            <span class="font-bold">{{ $t("typeOfAlerts") }}:&nbsp;</span>\n            {{ props.alertsStatistics.typeOfAlerts.join(", ") }}\n          </p>\n          <p v-if="props.alertsStatistics.dataProviders?.length">\n            <span class="font-bold">{{ $t("dataProviders") }}:&nbsp;</span>\n            {{ props.alertsStatistics.dataProviders.join(", ") }}\n          </p>\n          <p>\n            <span class="font-bold"\n              >{{ $t("alertDetectionRange") }}:&nbsp;</span\n            >\n            {{ props.alertsStatistics.alertDetectionRange }}\n          </p>\n          <p>\n            <span class="font-bold">{{ $t("recentAlertsDate") }}:&nbsp;</span>\n            {{ props.alertsStatistics.recentAlertsDate }}\n          </p>\n          <p>\n            <span class="font-bold">{{ $t("recentAlertsNumber") }}:&nbsp;</span>\n            {{ $n(props.alertsStatistics.recentAlertsNumber) }}\n          </p>\n          <p>\n            <span class="font-bold">{{ $t("alertsTotal") }}:&nbsp;</span>\n            {{ $n(props.alertsStatistics.alertsTotal) }}\n          </p>\n          <p\n            v-if="\n              props.calculateHectares && props.alertsStatistics.hectaresTotal\n            "\n          >\n            <span class="font-bold">{{ $t("hectaresTotal") }}:&nbsp;</span>\n            {{ $n(Number(props.alertsStatistics.hectaresTotal)) }}\n          </p>\n        </div>\n      </div>\n    </div>\n\n    <div\n      v-if="props.alertsStatistics && props.alertsStatistics.alertsTotal > 0"\n      class="rounded-2xl border border-violet-100 bg-violet-50 text-card-foreground shadow-sm"\n      data-testid="alerts-chart"\n    >\n      <div class="p-6">\n        <AlertsChart\n          :alerts-statistics="props.alertsStatistics"\n          :calculate-hectares="props.calculateHectares"\n        />\n      </div>\n    </div>\n\n    <div\n      v-if="showDownloads"\n      class="rounded-2xl border border-violet-100 bg-violet-50 text-card-foreground shadow-sm"\n      data-testid="alerts-download-data"\n    >\n      <div class="p-6 space-y-5">\n        <h3 class="text-2xl font-semibold tracking-tight">\n          {{ $t("downloadData") }}\n        </h3>\n\n        <div class="space-y-2">\n          <h4 class="text-sm font-semibold">\n            {{ $t("downloadAlertLocations") }}\n          </h4>\n          <p class="text-sm text-muted-foreground">\n            {{ $t("downloadAlertLocationsDescription") }}\n          </p>\n          <div class="flex justify-center [&>div]:!mt-0">\n            <DownloadMapData @download="emit(\'download\')"\n              :data-for-download="props.dataForAlertsIntroPanel"\n              :export-min-date="props.statsExportMinDate"\n              :export-max-date="props.statsExportMaxDate"\n              variant="violet"\n            />\n          </div>\n        </div>\n\n        <div class="border-t pt-5 space-y-2">\n          <h4 class="text-sm font-semibold">\n            {{ $t("downloadMonthlySummary") }}\n          </h4>\n          <p class="text-sm text-muted-foreground">\n            {{ $t("downloadMonthlySummaryDescription") }}\n          </p>\n          <div class="flex justify-center [&>div]:!mt-0">\n            <DownloadStatistics @download="emit(\'download-summary\')"\n              :min-date="props.statsExportMinDate"\n              :max-date="props.statsExportMaxDate"\n              filename-prefix="statistics"\n              variant="outline-violet"\n            />\n          </div>\n        </div>\n      </div>\n    </div>\n  </div>\n',
};
