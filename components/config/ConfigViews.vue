<script setup lang="ts">
import { Images, Map, TriangleAlert } from "lucide-vue-next";

const props = defineProps<{
  viewType: string;
}>();

/**
 * Resolves the icon component that represents the current view type.
 *
 * @returns {object} The Lucide icon component for the view type.
 */
const viewTypeIcon = computed(() => {
  if (props.viewType === "gallery") {
    return Images;
  }
  if (props.viewType === "alerts") {
    return TriangleAlert;
  }
  return Map;
});
</script>

<template>
  <div class="flex flex-wrap gap-4">
    <div
      data-testid="config-view-type-display"
      class="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-violet-50 border border-violet-200 text-violet-700 font-medium"
    >
      <component :is="viewTypeIcon" class="w-4 h-4" />
      <span>{{ $t(viewType) }}</span>
    </div>
  </div>
</template>
