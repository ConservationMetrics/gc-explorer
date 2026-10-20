<script setup lang="ts">
import { Info } from "lucide-vue-next";

defineProps<{
  content?: string;
  testId?: string;
}>();

/** Bottom-sheet sidebar layout, matching Tailwind's `sm` breakpoint. */
const MOBILE_TOOLTIP_QUERY = "(max-width: 639px)";

const showTooltip = ref(false);
const isMobileTooltip = ref(false);
const tooltipPosition = ref({ x: 0, y: 0 });
let hideTimeout: ReturnType<typeof setTimeout> | null = null;

/** Safely decode HTML entities without using v-html */
const decodeHtmlEntities = (text: string) => {
  const textarea = document.createElement("textarea");
  textarea.innerHTML = text;
  return textarea.value;
};

const cancelHideTooltip = () => {
  if (hideTimeout !== null) {
    clearTimeout(hideTimeout);
    hideTimeout = null;
  }
};

/** Place the tooltip beside the icon, or centered in the viewport on a phone. */
const showTooltipWithPosition = (event: MouseEvent) => {
  cancelHideTooltip();
  isMobileTooltip.value = window.matchMedia(MOBILE_TOOLTIP_QUERY).matches;

  if (!isMobileTooltip.value) {
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    tooltipPosition.value = { x: rect.right + 10, y: rect.top - 10 };
  }

  showTooltip.value = true;
};

const tooltipStyle = computed(() =>
  isMobileTooltip.value
    ? undefined
    : {
        left: `${tooltipPosition.value.x}px`,
        top: `${tooltipPosition.value.y}px`,
      },
);

/** Hide tooltip after a short delay so the cursor can reach a link inside it */
const scheduleHideTooltip = () => {
  cancelHideTooltip();
  hideTimeout = setTimeout(() => {
    showTooltip.value = false;
    hideTimeout = null;
  }, 150);
};
</script>

<template>
  <template v-if="content || $slots.default">
    <div class="relative inline-block">
      <Info
        class="w-4 h-4 text-gray-400 hover:text-gray-600 cursor-help transition-colors"
        @mouseenter="showTooltipWithPosition"
        @mouseleave="scheduleHideTooltip"
      />
    </div>

    <!-- Teleport tooltip outside of clipping containers (e.g. sidebar) -->
    <Teleport to="body">
      <div
        v-show="showTooltip"
        class="fixed z-[1080] p-3 text-xs text-gray-700 bg-white border border-gray-200 rounded-lg shadow-lg"
        :class="
          isMobileTooltip
            ? 'left-[10%] right-[10%] top-1/2 max-h-[80vh] -translate-y-1/2 overflow-y-auto'
            : 'w-80'
        "
        :style="tooltipStyle"
        :data-testid="testId"
        @mouseenter="cancelHideTooltip"
        @mouseleave="scheduleHideTooltip"
      >
        <div class="relative">
          <slot>{{ decodeHtmlEntities(content ?? "") }}</slot>
          <div
            v-if="!isMobileTooltip"
            class="absolute -bottom-2 left-1/2 transform -translate-x-1/2"
          >
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
