<script setup lang="ts">
import { Info } from "lucide-vue-next";

const props = defineProps<{
  dataProvider: string;
  alertType: string;
}>();

const { t } = useI18n();

const showTooltip = ref(false);
const tooltipPosition = ref({ x: 0, y: 0 });

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

/** Get tooltip content for confidence level based on data provider and alert type */
const getConfidenceLevelTooltip = (dataProvider: string, alertType: string) => {
  const entry = confidenceLevelTooltips.find(
    (tooltip) =>
      tooltip.provider === dataProvider && tooltip.alertType === alertType,
  );
  return entry?.text || "";
};

/** Safely decode HTML entities without using v-html */
const decodeHtmlEntities = (text: string) => {
  const textarea = document.createElement("textarea");
  textarea.innerHTML = text;
  return textarea.value;
};

/** Check if data provider and alert type combination has confidence level tooltip */
const hasConfidenceLevelTooltip = (
  dataProvider: string | undefined,
  alertType: string | undefined,
) => {
  if (!dataProvider || !alertType) return false;

  return confidenceLevelTooltips.some(
    (tooltip) =>
      tooltip.provider === dataProvider && tooltip.alertType === alertType,
  );
};

/** Handle tooltip show with position calculation */
const showTooltipWithPosition = (event: MouseEvent) => {
  const rect = (event.target as HTMLElement).getBoundingClientRect();
  const tooltipWidth = 320; // w-80 = 320px
  const tooltipHeight = 120; // Approximate tooltip height
  const screenWidth = window.innerWidth;
  const screenHeight = window.innerHeight;
  const isMobile = screenWidth < 768; // md breakpoint

  let x, y;

  if (isMobile) {
    // Mobile: center horizontally, position below icon if there's space, otherwise above
    x = (screenWidth - tooltipWidth) / 2;

    // Check if there's enough space below the icon
    if (rect.bottom + tooltipHeight + 10 < screenHeight) {
      y = rect.bottom + 10; // Position below icon
    } else {
      y = rect.top - tooltipHeight - 10; // Position above icon
    }
  } else {
    // Desktop: position to the right of icon
    x = rect.right + 10;
    y = rect.top - 10;
  }

  tooltipPosition.value = { x, y };
  showTooltip.value = true;
};

/** Hide tooltip */
const hideTooltip = () => {
  showTooltip.value = false;
};

// Only show tooltip if we have content for this provider/alert type combination
const shouldShowTooltip = computed(() => {
  return hasConfidenceLevelTooltip(props.dataProvider, props.alertType);
});
</script>

<template>
  <div v-if="shouldShowTooltip" class="relative inline-block">
    <Info
      class="w-4 h-4 text-gray-400 hover:text-gray-600 cursor-help transition-colors"
      @mouseenter="showTooltipWithPosition"
      @mouseleave="hideTooltip"
    />
  </div>

  <!-- Teleport tooltip outside of sidebar to avoid clipping -->
  <Teleport to="body">
    <div
      v-show="showTooltip"
      class="confidence-tooltip fixed w-80 p-3 text-xs text-gray-700 bg-white border border-gray-200 rounded-lg shadow-lg pointer-events-none"
      :style="{
        left: tooltipPosition.x + 'px',
        top: tooltipPosition.y + 'px',
      }"
      data-testid="confidence-level-tooltip"
    >
      <div class="relative">
        {{
          decodeHtmlEntities(
            getConfidenceLevelTooltip(props.dataProvider, props.alertType),
          )
        }}
        <!-- Tooltip arrow -->
        <div class="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
          <div class="border-4 border-transparent border-t-white"></div>
          <div
            class="border-4 border-transparent border-t-gray-200 -mt-1"
          ></div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.confidence-tooltip {
  z-index: 1000;
}
</style>
