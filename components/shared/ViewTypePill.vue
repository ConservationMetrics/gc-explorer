<script setup lang="ts">
import type { ViewType } from "@/types";
import { Images, Map, TriangleAlert } from "lucide-vue-next";

const props = defineProps<{
  viewType: ViewType;
}>();

const icon = computed(() => {
  if (props.viewType === "gallery") return Images;
  if (props.viewType === "alerts") return TriangleAlert;
  return Map;
});
</script>

<template>
  <div
    data-testid="config-view-type-display"
    class="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-violet-50 border border-violet-200 text-violet-700 font-medium"
  >
    <component :is="icon" class="w-4 h-4" />
    <span>{{ $t(viewType) }}</span>
  </div>
</template>
