<script setup lang="ts">
import type { ViewType } from "@/types";
import { Images, Map, TriangleAlert } from "lucide-vue-next";

defineProps<{
  modelValue: string;
  viewTypes: ViewType[];
}>();

const emit = defineEmits<{
  "update:modelValue": [value: string];
}>();
</script>

<template>
  <div class="flex flex-wrap gap-2">
    <button
      type="button"
      class="inline-flex items-center px-3 py-1.5 text-xs sm:text-sm font-medium rounded-lg border transition-colors"
      :class="
        modelValue === 'all'
          ? 'bg-violet-700 text-white border-violet-700'
          : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
      "
      @click="emit('update:modelValue', 'all')"
    >
      {{ $t("all") }}
    </button>
    <button
      v-for="viewType in viewTypes"
      :key="viewType"
      type="button"
      class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-medium rounded-lg border transition-colors capitalize"
      :class="
        modelValue === viewType
          ? 'bg-violet-700 text-white border-violet-700'
          : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
      "
      @click="emit('update:modelValue', viewType)"
    >
      <Map v-if="viewType === 'map'" class="w-3.5 h-3.5" />
      <Images v-else-if="viewType === 'gallery'" class="w-3.5 h-3.5" />
      <TriangleAlert v-else-if="viewType === 'alerts'" class="w-3.5 h-3.5" />
      {{ $t(viewType) }}
    </button>
  </div>
</template>
