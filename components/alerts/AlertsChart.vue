<script setup lang="ts">
import { computed } from "vue";
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

const props = defineProps({
  alertsStatistics: Object,
  calculateHectares: Boolean,
});

// Populate chart data
const chartData = computed(() => {
  const dataKey = props.calculateHectares
    ? "hectaresPerMonth"
    : "alertsPerMonth";
  const label = props.calculateHectares
    ? t("hectaresPerMonth")
    : t("numberOfAlerts");

  return {
    labels: Object.keys(props.alertsStatistics[dataKey]),
    datasets: [
      {
        backgroundColor: "rgba(0, 0, 0, 0)",
        borderColor: "#f87979",
        data: Object.values(props.alertsStatistics[dataKey]),
        fill: false,
        label: label,
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
