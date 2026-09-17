<script setup lang="ts">
import { Check, Copy } from "lucide-vue-next";

defineProps<{
  showCopied: boolean;
}>();

const emit = defineEmits<{
  copy: [];
}>();
</script>

<template>
  <div class="relative">
    <button
      type="button"
      class="relative flex h-10 w-10 items-center justify-center rounded-md bg-violet-700 text-white shadow-sm transition-colors hover:bg-violet-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2"
      :aria-label="showCopied ? $t('copied') : $t('copyMapLocation')"
      data-testid="copy-map-location-button"
      @click="emit('copy')"
    >
      <component
        :is="showCopied ? Check : Copy"
        class="h-5 w-5"
        :class="{ 'text-green-300': showCopied }"
        aria-hidden="true"
      />
    </button>
    <span
      class="copy-map-location-tooltip"
      :class="{ 'is-visible': showCopied }"
      role="tooltip"
    >
      {{ showCopied ? $t("copied") : $t("copyMapLocation") }}
    </span>
  </div>
</template>

<style scoped>
.copy-map-location-tooltip {
  position: absolute;
  top: 7px;
  right: 54px;
  padding: 6px 9px;
  border-radius: 4px;
  background: rgb(0 0 0 / 0.85);
  color: white;
  font-size: 12px;
  line-height: 1.35;
  white-space: nowrap;
  pointer-events: none;
  opacity: 0;
  transform: translateX(4px);
  transition:
    opacity 150ms cubic-bezier(0.23, 1, 0.32, 1),
    transform 150ms cubic-bezier(0.23, 1, 0.32, 1);
}

.copy-map-location-tooltip.is-visible,
button:focus-visible + .copy-map-location-tooltip {
  opacity: 1;
  transform: translateX(0);
}

@media (hover: hover) and (pointer: fine) {
  button:hover + .copy-map-location-tooltip {
    opacity: 1;
    transform: translateX(0);
  }
}

@media (prefers-reduced-motion: reduce) {
  .copy-map-location-tooltip {
    transition: none;
  }
}
</style>
