<script setup lang="ts">
import type { ViewConfig } from "@/types/types";

const props = defineProps<{
  tableName: string;
  config: ViewConfig;
  views: Array<string>;
  keys: Array<string>;
}>();

const localViews = ref([...props.views]);

// Watch for changes to views and emit updates
const emit = defineEmits(["update:views"]);

watch(
  () => props.views,
  (newViews) => {
    localViews.value = [...newViews];
  },
  { deep: true },
);

function updateViews() {
  emit("update:views", localViews.value);
}
</script>

<template>
  <div>
    <div v-for="key in keys" :key="key">
      <template v-if="key === 'VIEWS'">
        <div class="flex flex-wrap gap-4">
          <label class="flex items-center gap-2 cursor-pointer group">
            <input
              v-model="localViews"
              type="checkbox"
              value="map"
              class="w-5 h-5 text-purple-600 border-gray-300 rounded focus:ring-purple-500 focus:ring-2"
              @change="updateViews"
            />
            <span
              class="text-gray-700 font-medium group-hover:text-purple-700 transition-colors"
            >
              {{ $t("map") }}
            </span>
          </label>
          <label class="flex items-center gap-2 cursor-pointer group">
            <input
              v-model="localViews"
              type="checkbox"
              value="gallery"
              class="w-5 h-5 text-purple-600 border-gray-300 rounded focus:ring-purple-500 focus:ring-2"
              @change="updateViews"
            />
            <span
              class="text-gray-700 font-medium group-hover:text-purple-700 transition-colors"
            >
              {{ $t("gallery") }}
            </span>
          </label>
          <label class="flex items-center gap-2 cursor-pointer group">
            <input
              v-model="localViews"
              type="checkbox"
              value="alerts"
              class="w-5 h-5 text-purple-600 border-gray-300 rounded focus:ring-purple-500 focus:ring-2"
              @change="updateViews"
            />
            <span
              class="text-gray-700 font-medium group-hover:text-purple-700 transition-colors"
            >
              {{ $t("alerts") }}
            </span>
          </label>
        </div>
      </template>
    </div>
  </div>
</template>
