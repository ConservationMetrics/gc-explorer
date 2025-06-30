<script setup lang="ts">
import DownloadMapData from "~/components/shared/DownloadMapData.vue";

import type { AlertsData, AlertsStatistics } from "@/types/types";

const props = defineProps<{
  alertsStatistics: AlertsStatistics;
  calculateHectares?: boolean;
  dateOptions?: Array<string>;
  dataForAlertsIntroPanel?: AlertsData;
  logoUrl?: string;
  showSlider?: boolean;
}>();

const emit = defineEmits(["dateRangeChanged"]);
</script>

<template>
  <div class="space-y-4">
    <div class="rounded-lg border bg-card text-card-foreground shadow-sm">
      <div class="p-6 space-y-4">
        <NuxtImg
          v-if="props.logoUrl"
          :src="props.logoUrl"
          class="w-auto mx-auto mb-4 max-h-25"
          alt="Logo"
          loading="eager"
          :custom="true"
          v-slot="{ src, isLoaded, imgAttrs }"
        >
          <img
            v-if="isLoaded"
            v-bind="imgAttrs"
            :src="src"
            class="w-auto mx-auto mb-4 max-h-25"
          />

          <img
            v-else
            src="https://placehold.co/200x100/cccccc/666666?text=Logo"
            alt="Logo placeholder"
            class="w-auto mx-auto mb-4 max-h-25"
          />
        </NuxtImg>
        <h2 class="text-2xl font-semibold tracking-tight">
          {{ $t("changeDetectionAlerts")
          }}<span
            v-if="props.alertsStatistics.territory"
            class="text-muted-foreground"
            >: {{ props.alertsStatistics.territory }}</span
          >
        </h2>
        <div class="space-y-2 text-sm text-muted-foreground">
          <p class="italic">
            {{ $t("mostRecentAlertsShownIn") }}
            <span class="text-red-500 font-medium">{{ $t("red") }}</span
            >,
            {{ $t("andPreviousAlertsShownIn") }}
            <span class="text-orange-500 font-medium">{{ $t("orange") }}</span
            >.
          </p>
          <p class="italic inline-flex items-center whitespace-nowrap">
            {{ $t("ifYouAreZoomedOutAlertsWillBeShownAsA") }}&nbsp;
            <NuxtImg
              src="@/assets/icons/warning_red.png"
              alt="Warning icon"
              class="w-4 h-4 inline-block -mt-0.5 ml-0.5"
              preset="icon"
              loading="eager"
              :custom="true"
              v-slot="{ src, isLoaded, imgAttrs }"
            >
              <img
                v-if="isLoaded"
                v-bind="imgAttrs"
                :src="src"
                class="w-4 h-4 inline-block -mt-0.5 ml-0.5"
              />

              <img
                v-else
                src="https://placehold.co/16x16/ff0000/ffffff?text=!"
                alt="Warning icon placeholder"
                class="w-4 h-4 inline-block -mt-0.5 ml-0.5"
              /> </NuxtImg
            >.
          </p>
          <p class="italic">{{ $t("clickOnAlertsForMoreInfo") }}.</p>
        </div>

        <div class="space-y-2">
          <div
            v-if="props.alertsStatistics.typeOfAlerts?.length"
            class="flex items-center gap-2"
          >
            <span class="font-medium text-sm">{{ $t("typeOfAlerts") }}:</span>
            <span class="text-sm text-muted-foreground">{{
              props.alertsStatistics.typeOfAlerts.join(", ")
            }}</span>
          </div>
          <div
            v-if="props.alertsStatistics.dataProviders?.length"
            class="flex items-center gap-2"
          >
            <span class="font-medium text-sm">{{ $t("dataProviders") }}:</span>
            <span class="text-sm text-muted-foreground">{{
              props.alertsStatistics.dataProviders.join(", ")
            }}</span>
          </div>
          <div class="flex items-center gap-2">
            <span class="font-medium text-sm"
              >{{ $t("alertDetectionRange") }}:</span
            >
            <span class="text-sm text-muted-foreground">{{
              props.alertsStatistics.alertDetectionRange
            }}</span>
          </div>
          <div class="flex items-center gap-2">
            <span class="font-medium text-sm"
              >{{ $t("recentAlertsDate") }}:</span
            >
            <span class="text-sm text-muted-foreground">{{
              props.alertsStatistics.recentAlertsDate
            }}</span>
          </div>
          <div class="flex items-center gap-2">
            <span class="font-medium text-sm"
              >{{ $t("recentAlertsNumber") }}:</span
            >
            <span class="text-sm text-muted-foreground">{{
              props.alertsStatistics.recentAlertsNumber
            }}</span>
          </div>
          <div class="flex items-center gap-2">
            <span class="font-medium text-sm">{{ $t("alertsTotal") }}:</span>
            <span class="text-sm text-muted-foreground">{{
              props.alertsStatistics.alertsTotal
            }}</span>
          </div>
          <div
            v-if="
              props.calculateHectares && props.alertsStatistics.hectaresTotal
            "
            class="flex items-center gap-2"
          >
            <span class="font-medium text-sm">{{ $t("hectaresTotal") }}:</span>
            <span class="text-sm text-muted-foreground">{{
              props.alertsStatistics.hectaresTotal
            }}</span>
          </div>
        </div>
      </div>
    </div>

    <div
      v-if="props.showSlider"
      class="rounded-lg border bg-card text-card-foreground shadow-sm"
    >
      <div class="p-6">
        <AlertsSlider
          :date-options="props.dateOptions"
          @date-range-changed="emit('dateRangeChanged', $event)"
        />
        <div v-if="props.dataForAlertsIntroPanel" class="mt-4">
          <DownloadMapData :data-for-download="props.dataForAlertsIntroPanel" />
        </div>
      </div>
    </div>

    <div
      v-if="props.alertsStatistics"
      class="rounded-lg border bg-card text-card-foreground shadow-sm"
    >
      <div class="p-6">
        <AlertsChart
          :alerts-statistics="props.alertsStatistics"
          :calculate-hectares="props.calculateHectares"
        />
      </div>
    </div>
  </div>
</template>
