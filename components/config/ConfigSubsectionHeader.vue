<script setup lang="ts">
import Tooltip from "@/components/shared/Tooltip.vue";

defineProps<{
  tooltip?: string;
}>();
</script>

<template>
  <div class="flex items-center gap-1.5 border-b border-gray-200 pb-2">
    <h4 class="text-base font-bold text-gray-900">
      <slot></slot>
    </h4>
    <Tooltip v-if="tooltip" :content="tooltip" />
  </div>
</template>
