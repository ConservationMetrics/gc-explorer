<script setup lang="ts">
import { useI18n } from "vue-i18n";

import { Line as LineChart } from "vue-chartjs";
import {
  Chart,
  Title,
  Tooltip,
  Legend,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
} from "chart.js";

import type { AlertsStatistics } from "@/types/types";

Chart.register(
  Title,
  Tooltip,
  Legend,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
);

const { t } = useI18n();

const props = defineProps<{
  alertsStatistics: AlertsStatistics;
  calculateHectares: boolean;
}>();

// Populate chart data
const chartData = computed(() => {
  const prefersHectares = props.calculateHectares;
  const hasHectares = props.alertsStatistics.hectaresPerMonth !== null;

  const stats =
    prefersHectares && hasHectares
      ? props.alertsStatistics.hectaresPerMonth!
      : props.alertsStatistics.alertsPerMonth;

  const label =
    prefersHectares && hasHectares
      ? t("hectaresPerMonth")
      : t("numberOfAlerts");

  return {
    labels: Object.keys(stats),
    datasets: [
      {
        backgroundColor: "rgba(0, 0, 0, 0)",
        borderColor: "#f87979",
        data: Object.values(stats),
        fill: false,
        label,
        pointBackgroundColor: "#f87979",
      },
    ],
  };
});
</script>

<template>
  <div class="mt-4">
    <h3 class="text-2xl font-semibold mb-2">{{ $t("alertsLast12Months") }}</h3>
    <div class="mb-2">
      <LineChart :data="chartData" />
    </div>
  </div>
</template>
