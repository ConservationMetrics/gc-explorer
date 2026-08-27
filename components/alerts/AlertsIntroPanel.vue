<script setup lang="ts">
import DownloadMapData from "@/components/shared/DownloadMapData.vue";
import DownloadStatistics from "@/components/shared/DownloadStatistics.vue";
import AdminConfigGear from "@/components/shared/AdminConfigGear.vue";

import type { AlertsData, AlertsStatistics } from "@/types";

const props = defineProps<{
  alertsStatistics: AlertsStatistics;
  calculateHectares?: boolean;
  dateOptions?: Array<string>;
  dataForAlertsIntroPanel?: AlertsData;
  logoUrl?: string;
  showSlider?: boolean;
  statsExportMinDate?: string;
  statsExportMaxDate?: string;
  tableName?: string;
}>();

const emit = defineEmits(["dateRangeChanged"]);

const showDownloads = computed(
  () => Boolean(props.showSlider) && Boolean(props.dataForAlertsIntroPanel),
);
</script>

<template>
  <div class="space-y-4" data-testid="alerts-intro-panel">
    <div
      class="rounded-lg border bg-card text-card-foreground shadow-sm"
      data-testid="alerts-intro-header"
    >
      <div class="p-6 space-y-4">
        <img
          v-if="props.logoUrl"
          :src="props.logoUrl"
          class="w-auto mx-auto mb-4 max-h-25"
          alt="Logo"
          loading="eager"
        />
        <div class="flex items-center gap-2 pr-10">
          <h2 class="text-2xl font-semibold tracking-tight min-w-0">
            {{ $t("changeDetectionAlerts")
            }}<span
              v-if="props.alertsStatistics.territory"
              class="text-muted-foreground"
              >: {{ props.alertsStatistics.territory }}</span
            >
          </h2>
          <AdminConfigGear
            v-if="tableName"
            :table-name="tableName"
            view-type="alerts"
          />
        </div>
        <div
          v-if="props.alertsStatistics.alertsTotal > 0"
          class="space-y-2 text-sm text-muted-foreground"
        >
          <p class="italic">
            {{ $t("mostRecentAlertsShownIn") }}
            <span class="text-red-500 font-bold">{{ $t("red") }}</span
            >,
            {{ $t("andPreviousAlertsShownIn") }}
            <span class="text-orange-500 font-bold">{{ $t("orange") }}</span
            >.
          </p>
          <p class="italic">{{ $t("clickOnAlertsForMoreInfo") }}.</p>
        </div>
        <div
          v-if="props.showSlider"
          data-testid="alerts-date-range"
          class="pt-2"
        >
          <AlertsSlider
            :date-options="props.dateOptions"
            @date-range-changed="emit('dateRangeChanged', $event)"
          />
        </div>
      </div>
    </div>

    <div
      class="rounded-lg border bg-card text-card-foreground shadow-sm"
      data-testid="alerts-statistics"
    >
      <div class="p-6 space-y-4">
        <h3 class="text-2xl font-semibold tracking-tight">
          {{ $t("statistics") }}
        </h3>
        <div class="space-y-2 text-sm">
          <p v-if="props.alertsStatistics.typeOfAlerts?.length">
            <span class="font-bold">{{ $t("typeOfAlerts") }}:&nbsp;</span>
            {{ props.alertsStatistics.typeOfAlerts.join(", ") }}
          </p>
          <p v-if="props.alertsStatistics.dataProviders?.length">
            <span class="font-bold">{{ $t("dataProviders") }}:&nbsp;</span>
            {{ props.alertsStatistics.dataProviders.join(", ") }}
          </p>
          <p>
            <span class="font-bold"
              >{{ $t("alertDetectionRange") }}:&nbsp;</span
            >
            {{ props.alertsStatistics.alertDetectionRange }}
          </p>
          <p>
            <span class="font-bold">{{ $t("recentAlertsDate") }}:&nbsp;</span>
            {{ props.alertsStatistics.recentAlertsDate }}
          </p>
          <p>
            <span class="font-bold">{{ $t("recentAlertsNumber") }}:&nbsp;</span>
            {{ $n(props.alertsStatistics.recentAlertsNumber) }}
          </p>
          <p>
            <span class="font-bold">{{ $t("alertsTotal") }}:&nbsp;</span>
            {{ $n(props.alertsStatistics.alertsTotal) }}
          </p>
          <p
            v-if="
              props.calculateHectares && props.alertsStatistics.hectaresTotal
            "
          >
            <span class="font-bold">{{ $t("hectaresTotal") }}:&nbsp;</span>
            {{ $n(Number(props.alertsStatistics.hectaresTotal)) }}
          </p>
        </div>
      </div>
    </div>

    <div
      v-if="props.alertsStatistics && props.alertsStatistics.alertsTotal > 0"
      class="rounded-lg border bg-card text-card-foreground shadow-sm"
      data-testid="alerts-chart"
    >
      <div class="p-6">
        <AlertsChart
          :alerts-statistics="props.alertsStatistics"
          :calculate-hectares="props.calculateHectares"
        />
      </div>
    </div>

    <div
      v-if="showDownloads"
      class="rounded-lg border bg-card text-card-foreground shadow-sm"
      data-testid="alerts-download-data"
    >
      <div class="p-6 space-y-5">
        <h3 class="text-2xl font-semibold tracking-tight">
          {{ $t("downloadData") }}
        </h3>

        <div class="space-y-2">
          <h4 class="text-sm font-semibold">
            {{ $t("downloadAlertLocations") }}
          </h4>
          <p class="text-sm text-muted-foreground">
            {{ $t("downloadAlertLocationsDescription") }}
          </p>
          <div class="flex justify-center [&>div]:!mt-0">
            <DownloadMapData
              :data-for-download="props.dataForAlertsIntroPanel"
              variant="outline"
            />
          </div>
        </div>

        <div class="border-t pt-5 space-y-2">
          <h4 class="text-sm font-semibold">
            {{ $t("downloadMonthlySummary") }}
          </h4>
          <p class="text-sm text-muted-foreground">
            {{ $t("downloadMonthlySummaryDescription") }}
          </p>
          <div class="flex justify-center [&>div]:!mt-0">
            <DownloadStatistics
              :min-date="props.statsExportMinDate"
              :max-date="props.statsExportMaxDate"
              filename-prefix="statistics"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
