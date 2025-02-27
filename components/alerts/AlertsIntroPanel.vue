<script setup lang="ts">
import DownloadMapData from "~/components/shared/DownloadMapData.vue";

import type { AlertsData, AlertsStatistics } from "@/types/types";

const props = defineProps<{
  alertsStatistics: AlertsStatistics;
  calculateHectares?: boolean;
  dateOptions?: Array<string>;
  geojsonSelection?: AlertsData;
  logoUrl?: string;
  showSlider?: boolean;
}>();

const emit = defineEmits(["dateRangeChanged"]);
</script>

<template>
  <div>
    <!-- Header and stats -->
    <div class="feature p-4 rounded-lg shadow-lg">
      <div>
        <img
          v-if="props.logoUrl"
          :src="props.logoUrl"
          class="w-auto mx-auto mb-4 max-h-25"
          alt="Logo"
        />
        <h2 class="text-2xl font-semibold mb-2">
          {{ $t("changeDetectionAlerts") }}:
          {{ props.alertsStatistics.territory }}
        </h2>
        <p class="text-l mb-2 italic">
          {{ $t("mostRecentAlertsShownIn") }}
          <span style="color: #ff0000"
            ><strong>{{ $t("red") }}</strong></span
          >, {{ $t("andPreviousAlertsShownIn") }}
          <span style="color: #fd8d3c"
            ><strong>{{ $t("orange") }}</strong></span
          >.
        </p>
        <p class="text-l mb-2 italic">
          {{ $t("ifYouAreZoomedOutAlertsWillBeShownAsA") }}
          <!-- triangle icon located at @/assets/icons/warning_red.png-->
          <img
            src="@/assets/icons/warning_red.png"
            alt="Warning icon"
            class="w-4 h-4 inline-block"
          />.
        </p>
        <p class="text-l mb-2 italic">{{ $t("clickOnAlertsForMoreInfo") }}.</p>
        <div
          v-if="
            props.alertsStatistics.typeOfAlerts &&
            props.alertsStatistics.typeOfAlerts.length
          "
          class="mb-2"
        >
          <span class="font-bold">{{ $t("typeOfAlerts") }}:</span>
          {{ props.alertsStatistics.typeOfAlerts.join(", ") }}
        </div>
        <div
          v-if="
            props.alertsStatistics.dataProviders &&
            props.alertsStatistics.dataProviders.length
          "
          class="mb-2"
        >
          <span class="font-bold">{{ $t("dataProviders") }}:</span>
          {{ props.alertsStatistics.dataProviders.join(", ") }}
        </div>
        <div class="mb-2">
          <span class="font-bold">{{ $t("alertDetectionRange") }}:</span>
          {{ props.alertsStatistics.alertDetectionRange }}
        </div>
        <div class="mb-2">
          <span class="font-bold">{{ $t("recentAlertsDate") }}:</span>
          {{ props.alertsStatistics.recentAlertsDate }}
        </div>
        <div class="mb-2">
          <span class="font-bold">{{ $t("recentAlertsNumber") }}:</span>
          {{ props.alertsStatistics.recentAlertsNumber }}
        </div>
        <div class="mb-2">
          <span class="font-bold">{{ $t("alertsTotal") }}:</span>
          {{ props.alertsStatistics.alertsTotal }}
        </div>
        <div v-if="props.calculateHectares" class="mb-2">
          <span class="font-bold">{{ $t("hectaresTotal") }}:</span>
          {{ props.alertsStatistics.hectaresTotal }}
        </div>
      </div>
    </div>
    <!-- Slider -->
    <div v-if="props.showSlider" class="feature p-4 rounded-lg shadow-lg">
      <AlertsSlider
        :date-options="props.dateOptions"
        @date-range-changed="emit('dateRangeChanged', $event)"
      />
      <div v-if="props.geojsonSelection">
        <!-- Download -->
        <DownloadMapData
          :geojson="props.geojsonSelection"
          :type-of-data="'multiple-alerts'"
        />
      </div>
    </div>
    <!-- Chart -->
    <div v-if="props.alertsStatistics" class="feature p-4 rounded-lg shadow-lg">
      <AlertsChart
        :alerts-statistics="props.alertsStatistics"
        :calculate-hectares="props.calculateHectares"
      />
    </div>
  </div>
</template>
