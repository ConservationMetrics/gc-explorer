<script setup lang="ts">
import { Info } from "lucide-vue-next";

defineProps<{
  content: string;
  testId?: string;
}>();

const showTooltip = ref(false);
const tooltipPosition = ref({ x: 0, y: 0 });

/** Safely decode HTML entities without using v-html */
const decodeHtmlEntities = (text: string) => {
  const textarea = document.createElement("textarea");
  textarea.innerHTML = text;
  return textarea.value;
};

/** Handle tooltip show with position calculation */
const showTooltipWithPosition = (event: MouseEvent) => {
  const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
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
</script>

<template>
  <template v-if="content">
    <div class="relative inline-block">
      <Info
        class="w-4 h-4 text-gray-400 hover:text-gray-600 cursor-help transition-colors"
        @mouseenter="showTooltipWithPosition"
        @mouseleave="hideTooltip"
      />
    </div>

    <!-- Teleport tooltip outside of clipping containers (e.g. sidebar) -->
    <Teleport to="body">
      <div
        v-show="showTooltip"
        class="tooltip fixed w-80 p-3 text-xs text-gray-700 bg-white border border-gray-200 rounded-lg shadow-lg pointer-events-none"
        :style="{
          left: tooltipPosition.x + 'px',
          top: tooltipPosition.y + 'px',
        }"
        :data-testid="testId"
      >
        <div class="relative">
          {{ decodeHtmlEntities(content) }}
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
</template>

<style scoped>
.tooltip {
  z-index: 1000;
}
</style>
