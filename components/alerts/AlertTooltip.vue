<script setup lang="ts">
import Tooltip from "@/components/shared/Tooltip.vue";

const props = defineProps<{
  dataProvider: string;
  alertType: string;
}>();

const { t } = useI18n();

type TooltipEntry = {
  provider: string;
  alertType: string;
  text: string;
};

/** Confidence level tooltip definitions */
const confidenceLevelTooltips: TooltipEntry[] = [
  {
    provider: "Global Forest Watch",
    alertType: "nasa viirs fire alerts",
    text: t("confidenceLevelNasaVIIRSFireAlerts"),
  },
  {
    provider: "Global Forest Watch",
    alertType: "gfw integrated alerts",
    text: t("confidenceLevelGFWIntegratedAlerts"),
  },
  {
    provider: "Global Forest Watch",
    alertType: "gfw_glad_alerts",
    text: t("confidenceLevelGFWGladAlerts"),
  },
  {
    provider: "Imazon",
    alertType: "gold mining",
    text: t("confidenceLevelTerrasImazonGoldMining"),
  },
  {
    provider: "Terras",
    alertType: "gold mining",
    text: t("confidenceLevelTerrasImazonGoldMining"),
  },
];

const tooltipContent = computed(() => {
  const entry = confidenceLevelTooltips.find(
    (tooltip) =>
      tooltip.provider === props.dataProvider &&
      tooltip.alertType === props.alertType,
  );
  return entry?.text ?? "";
});
</script>

<template>
  <Tooltip :content="tooltipContent" test-id="confidence-level-tooltip" />
</template>
