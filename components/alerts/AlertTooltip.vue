<script setup lang="ts">
import { Info } from "lucide-vue-next";

const props = defineProps<{
  dataProvider: string;
  alertType: string;
}>();

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
    text: 'This value is based on a collection of intermediate algorithm quantities used in the detection process. It is intended to help users gauge the quality of individual hotspot/fire pixels. Confidence values are set to low, nominal and high. "Low" confidence daytime fire pixels are typically associated with areas of sun glint and lower relative temperature anomaly (<15K) in the mid-infrared channel I4. "Nominal" confidence pixels are those free of potential sun glint contamination during the day and marked by strong (>15K) temperature anomaly in either day or nighttime data. "High" confidence fire pixels are associated with day or nighttime saturated pixels.',
  },
  {
    provider: "Global Forest Watch",
    alertType: "gfw integrated alerts",
    text: 'Confidence levels help forest monitors prioritize alerts for follow up since satellite-derived data is subject to errors including false alerts. If two or more alert systems detect a change in the same location, we are more confident ("highest confidence") that these alerts indicate real disturbance. For individual systems, there is a delay before a first detection can be verified by additional satellite passes and thus reach "high confidence." The integrated layer displays where multiple systems overlap, in some cases providing increased confidence faster than waiting for individual systems to reach high confidence through additional satellite images, which can take weeks or months. False positives are effectively eliminated in the highest confidence class as it\'s uncommon for two systems to commit the same error since they use different data streams and algorithms.',
  },
  {
    provider: "Global Forest Watch",
    alertType: "gfw_glad_alerts",
    text: "Probable loss is defined as a single observation to date flagged as loss. If there are repeat loss observations within 4 observations or 180 days it becomes confirmed loss, otherwise, it reverts back to no loss.",
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
        {{ getConfidenceLevelTooltip(props.dataProvider, props.alertType) }}
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
